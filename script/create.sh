#!/bin/bash

# JSON 파일 생성 함수
create_json_file() {
  SYMBOL=$1
  NAME=$2
  LOGO=$3
  NETWORKS=$4
  CEX=$5
  SERVICES=$6

  # CEX 및 Services 배열 처리
  CEX_JSON=$(echo "$CEX" | awk -F, '{for(i=1; i<=NF; i++) printf "\"%s\"%s", $i, (i<NF?",":"")}')
  SERVICES_JSON=$(echo "$SERVICES" | awk -F, '{for(i=1; i<=NF; i++) printf "\"%s\"%s", $i, (i<NF?",":"")}')
  
  # JSON 구조 생성
  JSON_CONTENT=$(cat <<EOF
{
  "Name": "$NAME",
  "Symbol": "$SYMBOL",
  "LogoURI": "$LOGO",
  "Networks": ["$NETWORKS"],
  "CEX": [${CEX_JSON}],
  "Services": [${SERVICES_JSON}]
}
EOF
)

  # JSON 파일 저장
  echo "$JSON_CONTENT" > "URI/Tokens/$SYMBOL.json"
  echo "파일 생성됨: $SYMBOL.json"
}

# 사용자 입력 받기
while true; do
  echo "새로운 토큰 정보를 입력하세요 (종료하려면 'exit' 입력)"

  read -p "토큰 심볼 (예: ETH): " SYMBOL
  [[ "$SYMBOL" == "exit" ]] && break

  read -p "토큰 이름 (예: Ethereum): " NAME
  read -p "로고 URL (예: https://cryptologos.cc/logos/ethereum-eth-logo.png): " LOGO
  read -p "네트워크 (예: Ethereum, Solana, XRP Ledger): " NETWORKS
  read -p "CEX 거래소 (쉼표로 구분, 없으면 엔터): " CEX
  read -p "지원 서비스 (쉼표로 구분, 없으면 엔터): " SERVICES

  # JSON 파일 생성 함수 호출
  create_json_file "$SYMBOL" "$NAME" "$LOGO" "$NETWORKS" "$CEX" "$SERVICES"

  echo "=============================="
done

echo "모든 JSON 파일이 생성되었습니다."
