// Salin seluruh kode ini dari awal sampai akhir
import { useState, useEffect } from "react";

export default function Home() {
  const SOL_MINT = "So11111111111111111111111111111111111111112";

  const [mode, setMode] = useState("tokenToSol");
  const [inputMint, setInputMint] = useState("");
  const [outputMint, setOutputMint] = useState("");
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const [tokenMap, setTokenMap] = useState({});
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [profitThreshold, setProfitThreshold] = useState(0.5);

  useEffect(() => {
    const cached = localStorage.getItem("jupiterTokens");
    if (cached) {
      setTokenMap(JSON.parse(cached));
    } else {
      fetch("https://token.jup.ag/all")
        .then((res) => res.json())
        .then((data) => {
          const map = {};
          data.forEach((token) => {
            map[token.address] = token;
          });
          localStorage.setItem("jupiterTokens", JSON.stringify(map));
          setTokenMap(map);
        })
        .catch(() => {
          setError("Gagal mengambil daftar token Jupiter");
        });
    }
  }, []);

  useEffect(() => {
    setQuotes([]);
    setError(null);
    setAlarmTriggered(false);
    if (mode === "tokenToSol") {
      setInputMint("");
      setAmount("1000");
    } else {
      setOutputMint("");
      setAmount("1");
    }
  }, [mode]);

  const getQuotes = async () => {
    setError(null);
    setQuotes([]);
    setAlarmTriggered(false);
    setLoading(true);

    try {
      let inputToken, outputToken;
      let decimalsInput = 0;
      let decimalsOutput = 0;

      if (mode === "tokenToSol") {
        inputToken = tokenMap[inputMint];
        outputToken = tokenMap[SOL_MINT];
        if (!inputToken) {
          setError("⚠️ Token input tidak ditemukan di Jupiter.");
          setLoading(false);
          return;
        }
        if (!outputToken) {
          setError("⚠️ Token SOL tidak ditemukan di Jupiter.");
          setLoading(false);
          return;
        }
        decimalsInput = inputToken.decimals || 0;
        decimalsOutput = outputToken.decimals || 0;
      } else {
        inputToken = tokenMap[SOL_MINT];
        outputToken = tokenMap[outputMint];
        if (!outputToken) {
          setError("⚠️ Token output tidak ditemukan di Jupiter.");
          setLoading(false);
          return;
        }
        if (!inputToken) {
          setError("⚠️ Token SOL tidak ditemukan di Jupiter.");
          setLoading(false);
          return;
        }
        decimalsInput = inputToken.decimals || 0;
        decimalsOutput = outputToken.decimals || 0;
      }

      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        setError("Jumlah token harus angka positif");
        setLoading(false);
        return;
      }

      const amountInBaseUnits = Math.round(amountNumber * 10 ** decimalsInput);

      const res = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${
          mode === "tokenToSol" ? inputMint : SOL_MINT
        }&outputMint=${
          mode === "tokenToSol" ? SOL_MINT : outputMint
        }&amount=${amountInBaseUnits}&slippage=1`
      );
      const data = await res.json();

      if (!data?.data?.length) {
        setError("❌ Tidak ada jalur swap ditemukan. Mungkin token kurang likuid.");
      } else {
        setQuotes(data.data);

        const best = data.data[0];
        const impact = parseFloat(best.priceImpactPct) * 100;
        if (impact <= 100 - profitThreshold) {
          setAlarmTriggered(true);
        }
      }
    } catch (err) {
      setError("❌ Gagal mengambil data dari Jupiter.");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (val, decimals) => {
    if (!val || !decimals) return "0";
    return (val / 10 ** decimals).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔁 Solana Arbitrage Swap Explorer</h1>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setMode("tokenToSol")}
          className={`px-4 py-2 rounded font-semibold ${
            mode === "tokenToSol" ? "bg-green-600" : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          Token → SOL
        </button>
        <button
          onClick={() => setMode("solToToken")}
          className={`px-4 py-2 rounded font-semibold ${
            mode === "solToToken" ? "bg-green-600" : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          SOL → Token
        </button>
      </div>

      <div className="space-y-4">
        {mode === "tokenToSol" ? (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Token Input (Smart Contract Address)
              </label>
              <input
                value={inputMint}
                onChange={(e) => setInputMint(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
                placeholder="Contoh: DezXn9E5Lm2TbJXRaF34AruU4G5t5fvnHwiAGJt3j74S (BONK)"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Jumlah Token Input</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
                placeholder="1000"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Token Output (Smart Contract Address)
              </label>
              <input
                value={outputMint}
                onChange={(e) => setOutputMint(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
                placeholder="Contoh: DezXn9E5Lm2TbJXRaF34AruU4G5t5fvnHwiAGJt3j74S (BONK)"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Jumlah SOL Input</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
                placeholder="1"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">🎯 Alarm Profit &gt; (%)</label>
          <input
            type="number"
            step="0.1"
            value={profitThreshold}
            onChange={(e) => setProfitThreshold(parseFloat(e.target.value))}
            className="w-full p-2 bg-gray-800 rounded"
          />
        </div>

        <button
          onClick={getQuotes}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 w-full py-2 rounded font-semibold"
        >
          {loading ? "⏳ Mengambil data..." : "🔍 Cari Jalur Swap"}
        </button>

        {error && <div className="text-red-400 text-sm mt-4">{error}</div>}

        {alarmTriggered && (
          <div className="text-green-400 text-lg mt-4">🚨 Rute swap menguntungkan ditemukan!</div>
        )}

        {quotes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">📊 Jalur Swap</h2>
            <table className="w-full bg-gray-900 rounded overflow-hidden text-sm">
              <thead>
                <tr className="bg-gray-800 text-left">
                  <th className="p-2">DEX</th>
                  <th className="p-2">Estimasi Output</th>
                  <th className="p-2">Price Impact</th>
                  <th className="p-2">Path</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, i) => {
                  const outMint = mode === "tokenToSol" ? SOL_MINT : outputMint;
                  return (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="p-2">{q.marketInfos.map((m) => m.label).join(", ")}</td>
                      <td className="p-2">{formatAmount(q.outAmount, tokenMap[outMint]?.decimals)}</td>
                      <td className="p-2">{(parseFloat(q.priceImpactPct) * 100).toFixed(2)}%</td>
                      <td className="p-2">
                        {q.marketInfos
                          .map((m) => m.inputMint.slice(0, 4) + "→" + m.outputMint.slice(0, 4))
                          .join(" → ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
