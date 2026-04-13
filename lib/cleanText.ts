export const cleanStageMarkers = (text: string): string => text.replace(/###STAGE:\d###/g, "").trim();
