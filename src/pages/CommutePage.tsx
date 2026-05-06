import { useEffect, useState, type FormEvent } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import './CommutePage.css';

interface CommuteSettings {
  homeStation: string;
  destinationStation: string;
  primaryOperatorId: string;
  primaryOperatorName: string;
  primaryLineName: string;
  alternativeStations: string[];
}

interface RouteLink {
  label: string;
  href: string;
}

interface CommuteStatusEntry {
  railway: string | null;
  status: string | null;
  text: string | null;
  updatedAt: string | null;
}

interface CommuteStatusResponse {
  settings: CommuteSettings | null;
  realtime: {
    supported: boolean;
    available: boolean;
    operatorName: string | null;
    lineName: string | null;
    sourceLabel: string | null;
    sourceUrl: string | null;
    message: string;
    entries: CommuteStatusEntry[];
    fetchedAt: string | null;
  };
  routeLinks: RouteLink[];
}

interface OperatorOption {
  value: string;
  label: string;
}

const EMPTY_SETTINGS: CommuteSettings = {
  homeStation: '',
  destinationStation: '',
  primaryOperatorId: '',
  primaryOperatorName: '',
  primaryLineName: '',
  alternativeStations: [],
};

const OPERATOR_OPTIONS: OperatorOption[] = [
  { value: '', label: '運行情報を使わない' },
  { value: 'odpt.Operator:Toei', label: '東京都交通局（無料・トークン不要）' },
  { value: 'odpt.Operator:TokyoMetro', label: '東京メトロ（ODPT無料トークン）' },
  { value: 'odpt.Operator:TWR', label: 'りんかい線（ODPT無料トークン）' },
  { value: 'odpt.Operator:TamaMonorail', label: '多摩モノレール（ODPT無料トークン）' },
];

function formatDateTime(value: string | null): string {
  if (!value) return '取得できませんでした';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toAlternativeStations(value: string): string[] {
  return value
    .split(',')
    .map((station) => station.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function CommutePage() {
  const [settings, setSettings] = useState<CommuteSettings>(EMPTY_SETTINGS);
  const [alternativeStationsInput, setAlternativeStationsInput] = useState('');
  const [statusData, setStatusData] = useState<CommuteStatusResponse | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadSettings() {
    setIsLoadingSettings(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/commute/settings', { credentials: 'include' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || '設定の取得に失敗しました。');
      }

      if (json.settings) {
        setSettings(json.settings);
        setAlternativeStationsInput(json.settings.alternativeStations.join(', '));
      } else {
        setSettings(EMPTY_SETTINGS);
        setAlternativeStationsInput('');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '設定の取得に失敗しました。');
    } finally {
      setIsLoadingSettings(false);
    }
  }

  async function loadStatus() {
    setIsLoadingStatus(true);

    try {
      const response = await fetch('/api/commute/status', { credentials: 'include' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || '運行情報の取得に失敗しました。');
      }

      setStatusData(json.data);
    } catch (error) {
      setStatusData(null);
      setErrorMessage(error instanceof Error ? error.message : '運行情報の取得に失敗しました。');
    } finally {
      setIsLoadingStatus(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void Promise.all([loadSettings(), loadStatus()]);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    const operator = OPERATOR_OPTIONS.find((option) => option.value === settings.primaryOperatorId);
    const payload = {
      homeStation: settings.homeStation.trim(),
      destinationStation: settings.destinationStation.trim(),
      primaryOperatorId: settings.primaryOperatorId,
      primaryOperatorName: operator?.label ?? '',
      primaryLineName: settings.primaryLineName.trim(),
      alternativeStations: toAlternativeStations(alternativeStationsInput),
    };

    try {
      const response = await fetch('/api/commute/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || '設定の保存に失敗しました。');
      }

      setSettings(json.settings);
      setAlternativeStationsInput(json.settings.alternativeStations.join(', '));
      setSaveMessage('通勤ルートを保存しました。');
      await loadStatus();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '設定の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main animate-fade-in commute-page">
          <div className="commute-header">
            <div>
              <p className="commute-eyebrow">Commute</p>
              <h1 className="commute-title">通勤ルートの見守り</h1>
              <p className="commute-description">
                最寄り駅と目的地を保存しておくと、対応事業者の運行情報と、遅延時に使える代替検索リンクをまとめて確認できます。
              </p>
            </div>
            <button className="btn btn-ghost" onClick={() => void loadStatus()} disabled={isLoadingStatus}>
              {isLoadingStatus ? '更新中...' : '運行情報を更新'}
            </button>
          </div>

          {saveMessage && <div className="alert alert-success">{saveMessage}</div>}
          {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

          <div className="commute-grid">
            <section className="card commute-card">
              <div className="commute-card-header">
                <div>
                  <h2>ルート設定</h2>
                  <p>駅名だけでも保存できます。運行情報を使う場合は事業者も設定してください。</p>
                </div>
              </div>

              {isLoadingSettings ? (
                <p className="text-muted">設定を読み込んでいます...</p>
              ) : (
                <form className="commute-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="home-station">最寄り駅</label>
                    <input
                      id="home-station"
                      className="form-input"
                      placeholder="例: 中野駅"
                      value={settings.homeStation}
                      onChange={(event) => setSettings((current) => ({ ...current, homeStation: event.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="destination-station">目的地の駅</label>
                    <input
                      id="destination-station"
                      className="form-input"
                      placeholder="例: 大手町駅"
                      value={settings.destinationStation}
                      onChange={(event) => setSettings((current) => ({ ...current, destinationStation: event.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="primary-operator">主に使う事業者</label>
                    <select
                      id="primary-operator"
                      className="form-input"
                      value={settings.primaryOperatorId}
                      onChange={(event) => setSettings((current) => ({ ...current, primaryOperatorId: event.target.value }))}
                    >
                      {OPERATOR_OPTIONS.map((option) => (
                        <option key={option.value || 'none'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="primary-line-name">路線名（任意）</label>
                    <input
                      id="primary-line-name"
                      className="form-input"
                      placeholder="例: 東西線"
                      value={settings.primaryLineName}
                      onChange={(event) => setSettings((current) => ({ ...current, primaryLineName: event.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="alternative-stations">代替で使う駅（任意）</label>
                    <input
                      id="alternative-stations"
                      className="form-input"
                      placeholder="例: 高円寺駅, 東中野駅"
                      value={alternativeStationsInput}
                      onChange={(event) => setAlternativeStationsInput(event.target.value)}
                    />
                    <p className="text-muted">カンマ区切りで最大5件まで。遅延時の代替ルート検索リンクに使います。</p>
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={isSaving}>
                    {isSaving ? '保存中...' : '設定を保存'}
                  </button>
                </form>
              )}
            </section>

            <section className="card commute-card">
              <div className="commute-card-header">
                <div>
                  <h2>運行情報</h2>
                  <p>料金のかかる経路探索APIは使わず、無料公開データと外部検索リンクで構成しています。</p>
                </div>
              </div>

              {isLoadingStatus ? (
                <p className="text-muted">運行情報を読み込んでいます...</p>
              ) : !statusData?.settings ? (
                <p className="text-muted">まずは最寄り駅と目的地を保存してください。</p>
              ) : (
                <div className="commute-status">
                  <div className="status-summary">
                    <div>
                      <div className="status-route">
                        <strong>{statusData.settings.homeStation}</strong>
                        <span>→</span>
                        <strong>{statusData.settings.destinationStation}</strong>
                      </div>
                      <p className="status-meta">
                        {statusData.realtime.operatorName || '運行情報なし'}
                        {statusData.realtime.lineName ? ` / ${statusData.realtime.lineName}` : ''}
                      </p>
                    </div>
                    <div className="status-timestamp">
                      最終取得: {formatDateTime(statusData.realtime.fetchedAt)}
                    </div>
                  </div>

                  <div className={`status-banner ${statusData.realtime.available ? 'is-active' : 'is-muted'}`}>
                    <p>{statusData.realtime.message}</p>
                    {statusData.realtime.sourceUrl && (
                      <a href={statusData.realtime.sourceUrl} target="_blank" rel="noreferrer">
                        ソース: {statusData.realtime.sourceLabel}
                      </a>
                    )}
                  </div>

                  {statusData.realtime.entries.length > 0 && (
                    <div className="status-list">
                      {statusData.realtime.entries.map((entry, index) => (
                        <article key={`${entry.railway ?? 'line'}-${index}`} className="status-item">
                          <div className="status-item-header">
                            <strong>{entry.railway || statusData.realtime.operatorName || '対象路線'}</strong>
                            <span>{entry.status || '詳細あり'}</span>
                          </div>
                          <p>{entry.text || '詳細テキストはありません。'}</p>
                          <small>{formatDateTime(entry.updatedAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="route-links">
                    <h3>代替ルート候補</h3>
                    <p className="text-muted">
                      登録した駅から Google マップの公共交通検索を開きます。外部リンクなので追加料金はかかりません。
                    </p>
                    <div className="route-links-grid">
                      {statusData.routeLinks.map((link) => (
                        <a
                          key={link.href}
                          className="route-link-card"
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{link.label}</span>
                          <strong>検索を開く</strong>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="card commute-notes">
            <h2>使い方メモ</h2>
            <ul>
              <li>東京都交通局は公開APIで取得できます。東京メトロ、りんかい線、多摩モノレールは ODPT の無料トークン設定で有効になります。</li>
              <li>JR 東日本のリアルタイム運行情報は、2026年5月6日時点では一般向け通常ライセンスではなく challenge 限定データが中心なので、この実装には含めていません。</li>
              <li>より高度な代替経路の自動提案を入れる場合は、有料APIか独自経路探索のどちらかが必要になります。その段階では先に確認を取ります。</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
