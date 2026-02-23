export function toMutableResponse(response: Response): Response {
  return new Response(response.body, response);
}
