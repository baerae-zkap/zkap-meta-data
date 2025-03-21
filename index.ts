import fs from "fs";
import * as path from "path";

// 📌 Edge(연결) 데이터 구조
interface Edge {
  to: string;
  cost: number;
  time: number;
  network?: string;
  token?: string;
  action?: string;
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
function buildGraph(indexFile: string, tokenPrice: number): Graph {
  const index = loadJSON(indexFile);
  const graph: Graph = {};

  // 1️⃣ 은행 정보 로드
  for (const bank in index.Banks) {
    const bankData = index.Banks[bank];
    graph[bank] = [];

    bankData.withdrawNetworks.forEach((network: any) => {
      const edge: Edge = {
        to: network.destination,
        cost: network.fee * tokenPrice,
        time: network.time,
        network: network.network,
        action: "입금",
      };
      graph[bank].push(edge);
    });
  }

  // 2️⃣ CEX 정보 로드 (토큰 구매 및 출금 포함 + 스왑 추가)
  for (const cex in index.CEX) {
    const cexData = index.CEX[cex];
    graph[cex] = [];

    cexData.tokens.forEach((token: any) => {
      const edge: Edge = {
        to: cex,
        cost: parseFloat(cexData.marketFee) * tokenPrice,
        time: 0,
        network: token.network,
        token: token.symbol,
        action: "매수",
      };
      graph[cex].push(edge);

      token.withdrawNetworks.forEach((network: any) => {
        const edge: Edge = {
          to: network.destination,
          cost: parseFloat(network.exchangeFee) * tokenPrice,
          time: parseFloat(network.withdrawTime),
          network: network.network,
          token: token.symbol,
          action: "출금",
        };
        graph[cex].push(edge);
      });

      token.swapTokens.forEach((token: any) => {
        const edge: Edge = {
          to: cex,
          cost: token.estimatedFee * tokenPrice,
          time: token.swapTime,
          network: token.network,
          token: token.symbol,
          action: "교환",
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
      const edge: Edge = {
        to: token.to,
        cost: token.fee * tokenPrice,
        time: token.time,
        network: token.network,
        token: token.token,
        action: "교환",
      };
      graph[wallet].push(edge);
    });
  }

  return graph;
}

// const tokenSymbol = 'VIRTUAL';
const tokenPrice = 1;
// ✅ 실행 코드
const graph = buildGraph("./URI/merged.json", tokenPrice);
console.log(graph);
