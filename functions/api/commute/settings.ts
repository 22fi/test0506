import type { Env } from '../_middleware';
import {
  ensureCommuteSettingsTable,
  normalizeAlternativeStations,
  toResponseSettings,
  type CommuteSettingsRecord,
} from './_shared';

interface SettingsPayload {
  homeStation?: unknown;
  destinationStation?: unknown;
  primaryOperatorId?: unknown;
  primaryOperatorName?: unknown;
  primaryLineName?: unknown;
  alternativeStations?: unknown;
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

  return Response.json({
    success: true,
    settings: toResponseSettings(record),
  });
};

export const onRequestPost: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureCommuteSettingsTable(context.env.DB);

  const payload = await context.request.json<SettingsPayload>();

  const homeStation = typeof payload.homeStation === 'string' ? payload.homeStation.trim() : '';
  const destinationStation = typeof payload.destinationStation === 'string' ? payload.destinationStation.trim() : '';
  const primaryOperatorId = typeof payload.primaryOperatorId === 'string' ? payload.primaryOperatorId.trim() : '';
  const primaryOperatorName = typeof payload.primaryOperatorName === 'string' ? payload.primaryOperatorName.trim() : '';
  const primaryLineName = typeof payload.primaryLineName === 'string' ? payload.primaryLineName.trim() : '';
  const alternativeStations = normalizeAlternativeStations(payload.alternativeStations);

  if (!homeStation || !destinationStation) {
    return Response.json(
      { success: false, message: '最寄り駅と目的地の駅は必須です。' },
      { status: 400 },
    );
  }

  if (homeStation.length > 100 || destinationStation.length > 100 || primaryLineName.length > 100) {
    return Response.json(
      { success: false, message: '入力が長すぎます。100文字以内で設定してください。' },
      { status: 400 },
    );
  }

  await context.env.DB.prepare(`
    INSERT INTO commute_settings (
      user_id,
      home_station,
      destination_station,
      primary_operator_id,
      primary_operator_name,
      primary_line_name,
      alternative_stations,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      home_station = excluded.home_station,
      destination_station = excluded.destination_station,
      primary_operator_id = excluded.primary_operator_id,
      primary_operator_name = excluded.primary_operator_name,
      primary_line_name = excluded.primary_line_name,
      alternative_stations = excluded.alternative_stations,
      updated_at = datetime('now')
  `)
    .bind(
      context.data.userId,
      homeStation,
      destinationStation,
      primaryOperatorId || null,
      primaryOperatorName || null,
      primaryLineName || null,
      JSON.stringify(alternativeStations),
    )
    .run();

  const savedRecord = await context.env.DB.prepare(`
    SELECT home_station, destination_station, primary_operator_id, primary_operator_name, primary_line_name, alternative_stations
    FROM commute_settings
    WHERE user_id = ?
  `)
    .bind(context.data.userId)
    .first<CommuteSettingsRecord>();

  return Response.json({
    success: true,
    settings: toResponseSettings(savedRecord),
  });
};
