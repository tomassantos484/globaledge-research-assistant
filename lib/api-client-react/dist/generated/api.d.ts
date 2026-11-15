import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, HealthStatus, ResearchQuestion, ResearchResult, ResearchRuntimeStatus } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetResearchRuntimeStatusUrl: () => string;
/**
 * Reports non-secret mode and configuration flags without claiming external reachability.
 * @summary Get research runtime status
 */
export declare const getResearchRuntimeStatus: (options?: Parameters<typeof customFetch>[1]) => Promise<ResearchRuntimeStatus>;
export declare const getGetResearchRuntimeStatusQueryKey: () => readonly ["/api/status"];
export declare const getGetResearchRuntimeStatusQueryOptions: <TData = Awaited<ReturnType<typeof getResearchRuntimeStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResearchRuntimeStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResearchRuntimeStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResearchRuntimeStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getResearchRuntimeStatus>>>;
export type GetResearchRuntimeStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get research runtime status
 */
export declare function useGetResearchRuntimeStatus<TData = Awaited<ReturnType<typeof getResearchRuntimeStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResearchRuntimeStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAskGlobalEdgeUrl: () => string;
/**
 * Submits a single question to the configured research transport and returns a normalized result.
 * @summary Ask a research question
 */
export declare const askGlobalEdge: (researchQuestion: ResearchQuestion, options?: Parameters<typeof customFetch>[1]) => Promise<ResearchResult>;
export declare const getAskGlobalEdgeMutationKey: () => readonly ["askGlobalEdge"];
export declare const getAskGlobalEdgeMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof askGlobalEdge>>, TError, AskGlobalEdgeMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof askGlobalEdge>>, TError, AskGlobalEdgeMutationVariables, TContext>;
export type AskGlobalEdgeMutationResult = NonNullable<Awaited<ReturnType<typeof askGlobalEdge>>>;
export type AskGlobalEdgeMutationBody = BodyType<ResearchQuestion>;
export type AskGlobalEdgeMutationError = ErrorType<ApiError>;
export type AskGlobalEdgeMutationVariables = {
    data: BodyType<ResearchQuestion>;
};
/**
* @summary Ask a research question
*/
export declare const useAskGlobalEdge: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof askGlobalEdge>>, TError, AskGlobalEdgeMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof askGlobalEdge>>, TError, AskGlobalEdgeMutationVariables, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map