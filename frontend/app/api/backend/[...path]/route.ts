type RouteContext = {
  params: {
    path: string[];
  };
};

async function proxyBackendRequest(request: Request, { params }: RouteContext) {
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
  const path = params.path.map((segment) => encodeURIComponent(segment)).join('/');
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(`${path}${requestUrl.search}`, `${backendUrl.replace(/\/+$/, '')}/`);
  const headers = new Headers();

  for (const header of ['accept', 'content-type', 'x-request-id']) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer(),
    cache: 'no-store'
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  });
}

export const GET = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
export const OPTIONS = proxyBackendRequest;
