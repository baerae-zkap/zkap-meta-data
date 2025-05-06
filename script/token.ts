import { coinNameI18n, CoinNameType } from "@baerae-zkap/common-registry";
import fs from "fs";
import { TOKEN_SHEET_ID, fetchAllSheets } from "./util";

// 가져올 시트 목록
const SHEET_NAMES = ["Tokens", "Contracts"] as const;

type SheetName = (typeof SHEET_NAMES)[number];

// 전역 변수로 모든 시트 데이터 저장
const sheetData: Record<SheetName, any[]> = {} as Record<SheetName, any[]>;

// 모든 시트 분석을 처리하는 함수
async function sheetAnalyzers(): Promise<void> {
  const tokens = sheetData["Tokens"];
  const contracts = sheetData["Contracts"];
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

    // coinNameI18n에서 en-US 이름 조회
    const tokenName = coinNameI18n[symbol as CoinNameType]?.["en-US"] || symbol;

    // 키워드 데이터 준비
    const keywords =
      token["Keywords"]?.split(",").map((k: string) => k.trim()) || [];

    // 전체 키워드 데이터에 추가
    allKeywordsData[symbol] = keywords;

    // 필요한 데이터 추출
    const tokenData = {
      symbol: symbol,
      name: tokenName,
      logoURL: token["LogoURL"],
      networks: contracts
        .filter((c) => c["Symbol"] === symbol)
        .map((c) =>
          c["Contract Address"]
            ? `${c["Network"]}:${c["Contract Address"]}`
            : c["Network"]
        ),
      tags: token["Tags"]?.split(",").map((t: string) => t.trim()) || [],
    };

    // allTokensData에 토큰 데이터 추가
    allTokensData[symbol] = tokenData;

    // JSON 파일로 저장
    const fileName = `${outputDir}/Tokens/${symbol}.json`;
    fs.writeFileSync(fileName, JSON.stringify(tokenData, null, 2));
    console.log(`토큰 데이터 저장 완료: ${fileName}`);
  }

  // 전체 키워드 데이터를 하나의 파일로 저장
  const keywordsFileName = `${outputDir}/keywords.json`;
  fs.writeFileSync(keywordsFileName, JSON.stringify(allKeywordsData, null, 2));
  console.log(`전체 키워드 데이터 저장 완료: ${keywordsFileName}`);

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
