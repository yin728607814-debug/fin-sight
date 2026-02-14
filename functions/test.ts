// 测试 Function
export async function onRequest() {
  return new Response(JSON.stringify({ message: 'Functions 工作正常！' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
