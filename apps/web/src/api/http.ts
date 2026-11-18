interface FieldError {
  field: string;
  message: string;
}

// an error answer from the API, with its status so the screen can react to it
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
  }
}

export async function send(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed with status ${res.status}`, body.details);
  }
  return res;
}

export async function getJson<T>(url: string): Promise<T> {
  return (await send(url)).json();
}
