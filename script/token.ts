import { coinNameI18n, CoinNameType } from "@baerae-zkap/common-registry";
import fs from "fs";
import { TOKEN_SHEET_ID, fetchAllSheets } from "./util";

// 가져올 시트 목록
const SHEET_NAMES = ["Tokens"] as const;

type SheetName = (typeof SHEET_NAMES)[number];

// 전역 변수로 모든 시트 데이터 저장
const sheetData: Record<SheetName, any[]> = {} as Record<SheetName, any[]>;

// 모든 시트 분석을 처리하는 함수
async function sheetAnalyzers(): Promise<void> {
  const tokens = sheetData["Tokens"];
  if (!tokens || tokens.length === 0) {
    console.error("토큰 데이터가 없습니다.");
    return;
  }

  // URI/Tokens 디렉토리가 없으면 생성
  const outputDir = "URI";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 모든 토큰의 키워드 정보를 저장할 객체
  const allKeywordsData: Record<string, string[]> = {};
  const allTokensData: Record<string, any> = {};

  // 각 토큰 데이터 처리
  for (const token of tokens) {
    const symbol = token["Symbol"];
    if (!symbol) {
      console.error("토큰 심볼이 없습니다:", token);
      continue;
    }

    // 필요한 데이터 추출
    const tokenData = {
      logoURL: token["LogoURL"],
      exchanges:
        token["Exchanges"]?.split(",").map((t: string) => t.trim()) || [],
      keywords:
        token["Keywords"]?.split(",").map((k: string) => k.trim()) || [],
    };

    // allTokensData에 토큰 데이터 추가
    allTokensData[symbol] = tokenData;
  }

  // 전체 토큰 데이터를 하나의 파일로 저장
  const tokensFileName = `${outputDir}/tokens.json`;
  fs.writeFileSync(tokensFileName, JSON.stringify(allTokensData, null, 2));
  console.log(`전체 토큰 데이터 저장 완료: ${tokensFileName}`);
}

// 모든 시트 가져오기
async function fetchAllTokenSheets(): Promise<void> {
  // 모든 시트 데이터 수집
  await fetchAllSheets(TOKEN_SHEET_ID, SHEET_NAMES, sheetData);

  // 수집된 데이터에 분석기 적용
  await sheetAnalyzers();
}

fetchAllTokenSheets();
