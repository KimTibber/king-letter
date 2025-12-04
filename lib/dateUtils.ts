/**
 * 날짜 포맷팅 유틸리티 함수
 */

/**
 * "2024.02.01" 형식을 "2024년 2월 1일"로 변환
 * @param dateStr - "YYYY.MM.DD" 형식의 날짜 문자열
 * @returns "YYYY년 M월 D일" 형식의 한국어 날짜 문자열
 */
export const formatKoreanDate = (dateStr: string): string => {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 앞의 0 제거
  const day = parseInt(parts[2], 10); // 앞의 0 제거

  return `${year}년 ${month}월 ${day}일`;
};

/**
 * DateTimeString을 한국 날짜로 변경
 * @param date - Date 객체
 * @returns "YYYY. MM. DD" 형식의 날짜 문자열
 */
export const formatDateKoreanLocaleString = (dateStr: string): string => {
  return new Date(dateStr)
  .toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateKoreanLocaleStringSimplize = (dateStr: string): string => {
  return formatDateKoreanLocaleString(dateStr)
    .replace(/\./g, "")
    .replace(/\s/g, ".")
    .replace(/-$/, "");
};
