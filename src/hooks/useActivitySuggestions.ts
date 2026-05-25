import { useEffect, useState } from 'react';
import { UserInfo } from './useUserInfoForm';
import { WeatherData } from '../api/weather';

interface SuggestionResult {
  suggestions: string;
  loading: boolean;
  error: string | null;
}

export function useActivitySuggestions(userInfo: UserInfo, weather: WeatherData | null): SuggestionResult {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo || !weather) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

        const allHours = weather.hourly.time.map((t, i) => ({
          time: t,
          temp: weather.hourly.temperature_2m[i],
          humidity: weather.hourly.relative_humidity_2m?.[i] ?? 0,
          wind: weather.hourly.wind_speed_10m[i],
          precip: weather.hourly.precipitation_probability[i],
        }));

        const todayHours = allHours.filter(h => h.time.startsWith(today));
        const tomorrowHours = allHours.filter(h => h.time.startsWith(tomorrow));

        const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
        const mx = (a: number[]) => Math.max(...a);
        const mn = (a: number[]) => Math.min(...a);

        const summarizeHours = (hours: typeof allHours) => {
          const temps = hours.map(h => h.temp);
          const hums = hours.map(h => h.humidity);
          const winds = hours.map(h => h.wind);
          const precs = hours.map(h => h.precip);

          const tempLabel = avg(temps) >= 30 ? "非常に暑い" :
                            avg(temps) >= 25 ? "やや暑い" :
                            avg(temps) >= 18 ? "快適" : "涼しい";

          const humidityLabel = avg(hums) >= 70 ? "非常に湿度が高い" :
                                avg(hums) >= 50 ? "やや湿度が高い" : "快適";

          const hourlyDetails = hours.map(h => {
            const timeStr = h.time.slice(11, 16);
            return `  - ${timeStr}: 気温${h.temp.toFixed(1)}℃、湿度${h.humidity}%、風速${h.wind.toFixed(1)}m/s、降水確率${h.precip}%`;
          }).join('\n');

          return {
            temps, hums, winds, precs,
            tempLabel, humidityLabel,
            hourlyDetails
          };
        };

        const todaySummary = summarizeHours(todayHours);
        const tomorrowSummary = summarizeHours(tomorrowHours);

        // 外出時間帯チェック用
        const outingMap: Record<string, number[]> = {}; // 例: { "2025-07-03": [9,10,11,...17] }

        userInfo.schedule.forEach(day => {
          outingMap[day.date] = [];

          day.slots.forEach(slot => {
            const start = parseInt(slot.start.split(':')[0]);
            const end = parseInt(slot.end.split(':')[0]);

            for (let h = start; h < end; h++) {
              outingMap[day.date].push(h);
            }

            /* 降水確率分析
            const relevantHours = allHours.filter(h =>
              h.time.startsWith(day.date) &&
              (() => {
                const hour = parseInt(h.time.slice(11, 13));
                return hour >= start && hour < end;
              })()
            );

            const highPrecipHours = relevantHours.filter(h => h.precip >= 50);
            if (highPrecipHours.length > 0) {
              const times = highPrecipHours.map(h => `${h.time.slice(11, 16)}（${h.precip}%）`);
              rainDuringOutings.push(`- ${day.date} ${slot.start}〜${slot.end}: 降水確率高 → ${times.join(', ')}`);
            } else {
              rainDuringOutings.push(`- ${day.date} ${slot.start}〜${slot.end}: 降水確率低`);
            }*/
          });
        });

       /* const rainSummary = rainDuringOutings.length > 0
          ? `【外出時間中の降水確率】\n${rainDuringOutings.join('\n')}`
          : '外出時間中に高い降水確率は確認されませんでした。';
          */

        const summary = `
【天候情報（今日：1時間ごとの詳細）】
${todaySummary.hourlyDetails}
- 気温（平均）: ${avg(todaySummary.temps).toFixed(1)}℃（最低 ${mn(todaySummary.temps)}℃、最高 ${mx(todaySummary.temps)}℃） → ${todaySummary.tempLabel}
- 湿度（平均）: ${avg(todaySummary.hums).toFixed(0)}% → ${todaySummary.humidityLabel}
- 降水確率（平均）: ${avg(todaySummary.precs).toFixed(0)}%（最高 ${mx(todaySummary.precs)}%）
- 風速（平均）: ${avg(todaySummary.winds).toFixed(1)}m/s
- 紫外線指数（今日）: 最大 ${weather.daily.uv_index_max[0]}

【天候情報（明日：1時間ごとの詳細）】
${tomorrowSummary.hourlyDetails}
- 気温（平均）: ${avg(tomorrowSummary.temps).toFixed(1)}℃（最低 ${mn(tomorrowSummary.temps)}℃、最高 ${mx(tomorrowSummary.temps)}℃） → ${tomorrowSummary.tempLabel}
- 湿度（平均）: ${avg(tomorrowSummary.hums).toFixed(0)}% → ${tomorrowSummary.humidityLabel}
- 降水確率（平均）: ${avg(tomorrowSummary.precs).toFixed(0)}%（最高 ${mx(tomorrowSummary.precs)}%）
- 風速（平均）: ${avg(tomorrowSummary.winds).toFixed(1)}m/s
- 紫外線指数（明日）: 最大 ${weather.daily.uv_index_max[1] || weather.daily.uv_index_max[0]}

`.trim();

        const prompt = `
以下の情報をもとに、今日の生活を快適に過ごすための行動提案を日本語で作成してください。  
提案は以下の5つのカテゴリに分けて、箇条書きで具体的に示してください。  
天気の違いや降水確率、時間帯、気温・湿度の大小に応じて、提案内容に差をつけてください。

すべてのカテゴリで、外出している時間帯には行動を推奨しないでください。  
たとえば「9時〜17時外出」の場合、12時に洗濯などを推奨しないようにし、外出していない時間帯だけで実行可能な行動を提案してください。

【カテゴリ】
1. 家事（洗濯や掃除など。以下のルールに従って提案してください：
   - ユーザーが入力した家事のみを対象にし、それ以外の家事は一切提案しないこと。
   - 洗濯に関しては、今日の中で干すのに適した具体的な時間帯（1〜2つ程度）を示してください。ただし、外出中の時間帯は除外すること。
   - 明日の方が降水確率が低い場合は、「洗濯は明日に回した方が良い」と判断しても構いません。
   - その他の家事は今日のうちに実施することを前提とし、外出していない時間帯で提案してください。）
2. 外出準備（持ち物・注意点など。傘に関しては、外出時間帯の降水確率をもとに、通常の傘と折りたたみ傘のどちらが適切か具体的に判断してください。）
3. 空気環境（エアコン・乾燥機の使用提案。必要な場合のみ提案。）
4. 紫外線対策（外出時間帯に応じた対策を提案してください）
5. 服装（暑さ寒さ・紫外線に応じて適切な服装を提案してください）

# 天候情報
${summary}

# 家事設定
${userInfo.chores.map(c => `- ${c.name}`).join('\n')}

# 天候変化に活用できる持ち物一覧
${userInfo.items.map(i => `- ${i.name}`).join('\n')}

# 住環境設備の有無
- 加湿器: ${userInfo.hasHumidifier ? 'あり' : 'なし'}
- エアコン: ${userInfo.hasAirConditioner ? 'あり' : 'なし'}
- 乾燥機: ${userInfo.hasDryer ? 'あり' : 'なし'}

# 今日と明日の外出時間帯（この時間帯は全てのカテゴリで避けること）
${Object.entries(outingMap).map(([date, hours]) => {
  const ranges = hours.sort((a, b) => a - b).reduce((acc, h) => {
    const last = acc[acc.length - 1];
    if (!last || h !== last[1] + 1) acc.push([h, h]);
    else last[1] = h;
    return acc;
  }, [] as [number, number][]);
  return `- ${date}: ${ranges.map(([s, e]) => `${s}:00〜${e + 1}:00`).join(', ')}`;
}).join('\n')}
`.trim();

        console.log("=== OpenAIに送信するプロンプト ===");
        console.log(prompt);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600,
            temperature: 0.7,
          }),
        });

        if (!res.ok) throw new Error(`AI error ${res.status}`);
        const { choices } = await res.json();
        setSuggestions(choices[0].message.content.trim());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userInfo, weather]);

  return { suggestions, loading, error };
}
