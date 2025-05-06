import axios from "axios";
import fs from "fs";
import { PATH_SHEET_ID, fetchAllSheets } from "./util";

// 가져올 시트 목록
const SHEET_NAMES = ["Deposit", "Swap", "Withdraw"] as const;

type SheetName = (typeof SHEET_NAMES)[number];

// 전역 변수로 모든 시트 데이터 저장
const sheetData: Record<SheetName, any[]> = {} as Record<SheetName, any[]>;

// 모든 시트 분석을 처리하는 함수
async function sheetAnalyzers(): Promise<void> {
  const forwardNodes: any[] = [];
  const forwardIndex: Record<string, Record<string, string[]>> = {};

  console.log("=== 시트 데이터 분석 시작 ===");
  console.log("Deposit 데이터 수:", sheetData.Deposit.length);
  console.log("Swap 데이터 수:", sheetData.Swap.length);
  console.log("Withdraw 데이터 수:", sheetData.Withdraw.length);

  // 1inch 서비스 확인을 위한 로그
  const uniqueServices = new Set(sheetData.Swap.map((item) => item.Service));

  // Swap 시트에서 Service와 Pair1을 기준으로 분석
  for (const swapItem of sheetData.Swap) {
    const service = swapItem.Service;
    const pair1 = swapItem.Pair1;
    const pair2 = swapItem.Pair2;

    // 정방향 경로 (Pair1 -> Pair2)
    const depositMatch = sheetData.Deposit.find(
      (deposit) => deposit.Service === service && deposit.Currency === pair1
    );

    if (depositMatch) {
      const withdrawMatch = sheetData.Withdraw.find(
        (withdraw) =>
          withdraw.Service === service && withdraw.Currency === pair2
      );

      if (withdrawMatch) {
        const node = {
          id: `${depositMatch.Currency}/${depositMatch.Network}-${service}-${withdrawMatch.Currency}/${withdrawMatch.Network}`,
          service: service,
          deposit: {
            currency: depositMatch.Currency,
            network: depositMatch.Network,
            time: depositMatch.Time,
            confirmBlockCount: depositMatch.ConfirmBlockCount,
            fee: depositMatch.Fee,
            min: depositMatch.Min,
            max: depositMatch.Max,
            unit: depositMatch.Unit,
          },
          swap: {
            time: swapItem.Time,
            rate: swapItem.Rate,
            swapFeeBip: swapItem.SwapFeeBip,
            swapFeeUnit: swapItem.SwapFeeUnit,
            transactionBipFee: swapItem.TransactionBipFee,
            transactionFeeUnit: swapItem.TransactionFeeUnit,
            serviceFeeBip: swapItem.ServiceFeeBip,
            serviceFeeUnit: swapItem.ServiceFeeUnit,
          },
          withdraw: {
            currency: withdrawMatch.Currency,
            network: withdrawMatch.Network,
            time: withdrawMatch.Time,
            fee: withdrawMatch.Fee,
            min: withdrawMatch.Min,
            max: withdrawMatch.Max,
            unit: withdrawMatch.Unit,
          },
        };

        forwardNodes.push(node);

        // 인덱스에 노드 추가
        if (!forwardIndex[node.deposit.currency]) {
          forwardIndex[node.deposit.currency] = {};
        }
        if (!forwardIndex[node.deposit.currency][node.deposit.network]) {
          forwardIndex[node.deposit.currency][node.deposit.network] = [];
        }
        forwardIndex[node.deposit.currency][node.deposit.network].push(node.id);
      }
    }
  }

  console.log("\n=== 최종 결과 ===");
  console.log("노드 수:", forwardNodes.length);

  // 결과를 JSON 파일로 저장
  const result = {
    nodes: forwardNodes,
    index: forwardIndex,
  };

  fs.writeFileSync("URI/paths.json", JSON.stringify(result, null, 2), "utf-8");

  console.log("경로가 저장되었습니다.");
}

// 모든 시트 가져오기
async function fetchAllPathSheets(): Promise<void> {
  // 모든 시트 데이터 수집
  await fetchAllSheets(PATH_SHEET_ID, SHEET_NAMES, sheetData);

  // 수집된 데이터에 분석기 적용
  await sheetAnalyzers();
}

fetchAllPathSheets();
