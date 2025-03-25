import fs from "fs";
import * as path from "path";

// 📌 Edge(연결) 데이터 구조
interface Edge {
  step: string;
  from: string;
  to: string;
  cost: number;
  time: number;
  network?: string;
  token?: string;
}

// 📌 전체 그래프 데이터 구조
interface Graph {
  [key: string]: Edge[];
}

// 📌 JSON 파일을 동적으로 로드하는 함수
function loadJSON(filePath: string): any {
  const indexPath = path.join(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

// 📌 index.json을 로드하고, 관련 JSON 파일을 모두 읽어 그래프 구성
function buildGraph(
  indexFile: string,
  tokenPrice: number,
  tokenSymbol: string,
  tokenNetwork: string
): Graph {
  const index = loadJSON(indexFile);
  const graph: Graph = {};

  // 1️⃣ 은행 정보 로드
  for (const bank in index.Banks) {
    const bankData = index.Banks[bank];
    graph[bank] = [];

    bankData.withdrawNetworks.forEach((network: any) => {
      const edge: Edge = {
        step: "Bank",
        from: bank,
        to: network.destination,
        cost: network.fee * tokenPrice,
        time: network.time,
        network: network.network,
      };
      graph[bank].push(edge);
    });
  }
  let isTokenExist = false;
  for (const cex in index.CEX) {
    const cexData = index.CEX[cex];
    graph[cex] = [];
    cexData.stableTokens.forEach((token: any) => {
      if (token.symbol === tokenSymbol) {
        token.withdrawNetworks.forEach((network: any) => {
          if (network.network === tokenNetwork) {
            const edge: Edge = {
              step: "CEX",
              from: cex,
              to: network.destination,
              cost: network.fee * tokenPrice,
              time: network.time,
              token: token.symbol,
            };
            graph[cex].push(edge);
            isTokenExist = true;
          }
        });
      }
    });
    cexData.tokens.forEach((token: any) => {
      if (token.symbol === tokenSymbol) {
        token.withdrawNetworks.forEach((network: any) => {
          if (network.network === tokenNetwork) {
            const edge: Edge = {
              step: "CEX",
              from: cex,
              to: network.destination,
              cost: network.fee * tokenPrice,
              time: network.time,
              token: token.symbol,
            };
            graph[cex].push(edge);
            isTokenExist = true;
          }
        });
      }
    });
  }

  if (isTokenExist) {
    return graph;
  }

  // 2️⃣ CEX 정보 로드 (토큰 구매 및 출금 포함)
  for (const cex in index.CEX) {
    const cexData = index.CEX[cex];
    graph[cex] = [];

    cexData.tokens.forEach((token: any) => {
      const edge: Edge = {
        step: "CEX",
        from: cex,
        to: cex,
        cost: parseFloat(cexData.marketFee) * tokenPrice,
        time: 0,
        network: token.network,
        token: token.symbol,
      };
      graph[cex].push(edge);

      token.withdrawNetworks.forEach((network: any) => {
        const edge: Edge = {
          step: "CEX",
          from: cex,
          to: network.destination,
          cost: parseFloat(network.exchangeFee) * tokenPrice,
          time: parseFloat(network.withdrawTime),
          network: network.network,
          token: token.symbol,
        };
        graph[cex].push(edge);
      });
    });
  }

  // 3️⃣ 월렛 정보 로드
  for (const wallet in index.Wallets) {
    const walletData = index.Wallets[wallet];
    graph[wallet] = [];

    walletData.swapTokens.forEach((token: any) => {
      if (token.symbol === tokenSymbol) {
        const edge: Edge = {
          step: "Wallet",
          from: wallet,
          to: token.to,
          cost: token.fee * tokenPrice,
          time: token.time,
          network: token.network,
          token: token.token,
        };
        graph[wallet].push(edge);
      }
    });
  }

  return graph;
}

const tokenSymbol = "VIRTUAL";
const tokenNetwork = "Base";
const tokenPrice = 1;
// ✅ 실행 코드
const graph = buildGraph(
  "./URI/merged.json",
  tokenPrice,
  tokenSymbol,
  tokenNetwork
);
console.log(graph);
