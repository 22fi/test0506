import type { Env } from '../_middleware';
import {
  buildGoogleTransitLink,
  buildTrainInformationUrl,
  ensureCommuteSettingsTable,
  getOperatorSupport,
  toResponseSettings,
  type CommuteSettingsRecord,
} from './_shared';

interface OdptTrainInformation {
  'dc:date'?: string;
  'odpt:railway'?: string;
  'odpt:trainInformationStatus'?: string;
  'odpt:trainInformationText'?: string;
}

export const onRequestGet: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureCommuteSettingsTable(context.env.DB);

  const record = await context.env.DB.prepare(`
    SELECT home_station, destination_station, primary_operator_id, primary_operator_name, primary_line_name, alternative_stations
    FROM commute_settings
    WHERE user_id = ?
  `)
    .bind(context.data.userId)
    .first<CommuteSettingsRecord>();

  const settings = toResponseSettings(record);

  if (!settings) {
    return Response.json({
      success: true,
      data: {
        settings: null,
        realtime: {
          supported: false,
          available: false,
          operatorName: null,
          lineName: null,
          sourceLabel: null,
          sourceUrl: null,
          message: '通勤ルートが未設定です。',
          entries: [],
          fetchedAt: null,
        },
        routeLinks: [],
      },
    });
  }

  const routeLinks = [
    {
      label: `${settings.homeStation} から検索`,
      href: buildGoogleTransitLink(settings.homeStation, settings.destinationStation),
    },
    ...settings.alternativeStations.map((station) => ({
      label: `${station} から検索`,
      href: buildGoogleTransitLink(station, settings.destinationStation),
    })),
  ];

  const operator = settings.primaryOperatorId ? getOperatorSupport(settings.primaryOperatorId) : null;

  if (!operator) {
    return Response.json({
      success: true,
      data: {
        settings,
        realtime: {
          supported: false,
          available: false,
          operatorName: settings.primaryOperatorName || null,
          lineName: settings.primaryLineName || null,
          sourceLabel: null,
          sourceUrl: null,
          message: '事業者が未設定か、まだ対応していないため、運行情報は表示していません。',
          entries: [],
          fetchedAt: null,
        },
        routeLinks,
      },
    });
  }

  const requestUrl = buildTrainInformationUrl(context.env, operator);
  if (!requestUrl) {
    return Response.json({
      success: true,
      data: {
        settings,
        realtime: {
          supported: true,
          available: false,
          operatorName: operator.displayName,
          lineName: settings.primaryLineName || null,
          sourceLabel: operator.sourceLabel,
          sourceUrl: operator.sourceUrl,
          message: 'この事業者の運行情報には ODPT の無料アクセストークンが必要です。環境変数 ODPT_ACCESS_TOKEN を設定すると有効になります。',
          entries: [],
          fetchedAt: null,
        },
        routeLinks,
      },
    });
  }

  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`ODPT API returned ${response.status}`);
    }

    const payload = await response.json() as OdptTrainInformation[];
    const entries = payload.map((entry) => ({
      railway: entry['odpt:railway'] ?? null,
      status: entry['odpt:trainInformationStatus'] ?? null,
      text: entry['odpt:trainInformationText'] ?? null,
      updatedAt: entry['dc:date'] ?? null,
    }));

    const hasDetails = entries.some((entry) => entry.text || entry.status);
    const fetchedAt = entries[0]?.updatedAt ?? new Date().toISOString();

    return Response.json({
      success: true,
      data: {
        settings,
        realtime: {
          supported: true,
          available: true,
          operatorName: operator.displayName,
          lineName: settings.primaryLineName || null,
          sourceLabel: operator.sourceLabel,
          sourceUrl: operator.sourceUrl,
          message: hasDetails
            ? '最新の運行情報を取得しました。遅延や見合わせがある場合は下の詳細を確認してください。'
            : '運行情報は取得できましたが、表示できる詳細はありませんでした。',
          entries,
          fetchedAt,
        },
        routeLinks,
      },
    });
  } catch {
    return Response.json({
      success: true,
      data: {
        settings,
        realtime: {
          supported: true,
          available: false,
          operatorName: operator.displayName,
          lineName: settings.primaryLineName || null,
          sourceLabel: operator.sourceLabel,
          sourceUrl: operator.sourceUrl,
          message: '運行情報の取得に失敗しました。しばらくしてから再読み込みしてください。',
          entries: [],
          fetchedAt: null,
        },
        routeLinks,
      },
    });
  }
};
