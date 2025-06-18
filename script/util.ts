import axios from "axios";

// Google Sheets 문서 ID
export const TOKEN_SHEET_ID = "17bMYzMn9RkDpIv1M2O0hIqOc3I353C7w3s_IyoPLoIw";
export const PATH_SHEET_ID = "1bn0tLq8QRUkMyIDLMD5x0Z1mVmY4hFoEPqLxqwHfxu8";

export interface GoogleSheetResponse {
  table: {
    cols: Array<{ label: string }>;
    rows: Array<{
      c: Array<{ v: string | number | null } | null>;
    }>;
  };
}

export async function fetchGoogleSheet(
  sheetId: string,
  sheetName: string
): Promise<any[]> {
  const API_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&sheet=${sheetName}`;

  try {
    const response = await axios.get<string>(API_URL);
    const rawText = response.data;
    // JSON 데이터 부분만 추출
    const jsonText = rawText.match(/\{.*\}/s)?.[0];
    if (!jsonText) {
      throw new Error("JSON 데이터를 추출할 수 없습니다.");
    }

    const parsed = JSON.parse(jsonText) as GoogleSheetResponse;
    const table = parsed.table;

    if (!table || !table.cols || !table.rows) {
      console.error(`${sheetName} 시트 데이터가 올바르지 않습니다.`);
      return [];
    }

    let headers: string[];
    if (table.cols.every((col) => col.label === "")) {
      // `Tokens`처럼 헤더가 비어있는 경우 → 첫 번째 행을 헤더로 사용
      headers = table.rows[0].c
        .map((cell) => (cell ? cell.v : null))
        .filter((v): v is string | number => v !== null)
        .map(String);
      table.rows.shift(); // 첫 번째 행 삭제 (데이터에서 제외)
    } else {
      // 일반적인 경우 → `table.cols`에서 헤더 가져오기
      headers = table.cols.map((col) => col.label);
    }
    // ✅ 데이터 변환 (헤더와 맞춰 매핑)
    const jsonData = table.rows.map((row) => {
      const obj: Record<string, string | number | null> = {};
      row.c.forEach((cell, index) => {
        obj[headers[index]] = cell ? cell.v : null;
      });
      return obj;
    });

    return jsonData;
  } catch (error) {
    console.error(`${sheetName} 데이터를 불러오는 중 오류 발생:`, error);
    return [];
  }
}

export async function fetchAllSheets<T extends string>(
  sheetId: string,
  sheetNames: readonly T[],
  sheetData: Record<T, any[]>
): Promise<void> {
  // 모든 시트 데이터 수집
  for (const sheetName of sheetNames) {
    sheetData[sheetName] = await fetchGoogleSheet(sheetId, sheetName);
  }
}
