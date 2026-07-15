export function broadcastBottleDetection(data) {
  if (global.io) {
    global.io.to('bottle-detection').emit('bottle_detected', {
      type: 'bottle_detected',
      data: data,
      timestamp: new Date().toISOString(),
    });
    console.log('Broadcasting bottle detection via Socket.IO:', data);
  } else {
    console.warn('Socket.IO not available for broadcasting');
  }
}

export function getSocket() {
  return global.io;
}
