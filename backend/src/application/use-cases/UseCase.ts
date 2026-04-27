export abstract class UseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<TResponse>;
}
