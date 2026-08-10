/**
 * 좌표 계산과 단말 위치 조회
 */
export function haversineKm(a, b) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getPosition(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { reject(new Error("이 기기에서 위치 서비스를 쓸 수 없습니다")); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) }),
      e => reject(new Error(e && e.code === 1 ? "위치 권한이 거부되었습니다" : "위치를 확인하지 못했습니다")),
      { enableHighAccuracy: true, timeout, maximumAge: 0 });
  });
}
