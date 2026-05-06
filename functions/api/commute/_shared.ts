import type { Env } from '../_middleware';

export interface CommuteSettingsRecord {
  home_station: string;
  destination_station: string;
  primary_operator_id: string | null;
  primary_operator_name: string | null;
  primary_line_name: string | null;
  alternative_stations: string | null;
}

export interface CommuteSettingsResponse {
  homeStation: string;
  destinationStation: string;
  primaryOperatorId: string;
  primaryOperatorName: string;
  primaryLineName: string;
  alternativeStations: string[];
}

export interface OperatorSupport {
  id: string;
  displayName: string;
  sourceLabel: string;
  sourceUrl: string;
  mode: 'public' | 'token';
}

export const SUPPORTED_OPERATORS: OperatorSupport[] = [
  {
    id: 'odpt.Operator:Toei',
    displayName: '東京都交通局',
    sourceLabel: '公共交通オープンデータセンター',
    sourceUrl: 'https://ckan.odpt.org/dataset/r_train_status-toei',
    mode: 'public',
  },
  {
    id: 'odpt.Operator:TokyoMetro',
    displayName: '東京メトロ',
    sourceLabel: '公共交通オープンデータセンター',
    sourceUrl: 'https://ckan.odpt.org/dataset/r_train_status-tokyometro',
    mode: 'token',
  },
  {
    id: 'odpt.Operator:TWR',
    displayName: 'りんかい線',
    sourceLabel: '公共交通オープンデータセンター',
    sourceUrl: 'https://ckan.odpt.org/dataset/r_train_status-twr',
    mode: 'token',
  },
  {
    id: 'odpt.Operator:TamaMonorail',
    displayName: '多摩モノレール',
    sourceLabel: '公共交通オープンデータセンター',
    sourceUrl: 'https://ckan.odpt.org/dataset/r_train_status-tamamonorail',
    mode: 'token',
  },
];

export async function ensureCommuteSettingsTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS commute_settings (
      user_id TEXT PRIMARY KEY,
      home_station TEXT NOT NULL,
      destination_station TEXT NOT NULL,
      primary_operator_id TEXT,
      primary_operator_name TEXT,
      primary_line_name TEXT,
      alternative_stations TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
}

export function normalizeAlternativeStations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 5);
}

export function toResponseSettings(record: CommuteSettingsRecord | null): CommuteSettingsResponse | null {
  if (!record) return null;

  const alternativeStations = (() => {
    try {
      return normalizeAlternativeStations(
        record.alternative_stations ? JSON.parse(record.alternative_stations) : [],
      );
    } catch {
      return [];
    }
  })();

  return {
    homeStation: record.home_station,
    destinationStation: record.destination_station,
    primaryOperatorId: record.primary_operator_id ?? '',
    primaryOperatorName: record.primary_operator_name ?? '',
    primaryLineName: record.primary_line_name ?? '',
    alternativeStations,
  };
}

export function getOperatorSupport(operatorId: string): OperatorSupport | null {
  return SUPPORTED_OPERATORS.find((operator) => operator.id === operatorId) ?? null;
}

export function buildGoogleTransitLink(origin: string, destination: string): string {
  const params = new URLSearchParams({
    api: '1',
    travelmode: 'transit',
    origin,
    destination,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildTrainInformationUrl(env: Env, operator: OperatorSupport): string | null {
  if (operator.mode === 'public') {
    return `https://api-public.odpt.org/api/v4/odpt:TrainInformation?odpt:operator=${encodeURIComponent(operator.id)}`;
  }

  const accessToken = env.ODPT_ACCESS_TOKEN;
  if (!accessToken) return null;

  const params = new URLSearchParams({
    'odpt:operator': operator.id,
    'acl:consumerKey': accessToken,
  });

  return `https://api.odpt.org/api/v4/odpt:TrainInformation?${params.toString()}`;
}
