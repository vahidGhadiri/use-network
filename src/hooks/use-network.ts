import { useState, useEffect, useReducer } from "react"

type NetworkMethodType = "GET" | "POST" | "PUSH" | "UPDATE" | "DELETE" | "PUT"
type NetworkStatusType = "loading" | "error" | "success" | "idle"


interface NetworkResultType<T> {
    status?: NetworkStatusType
    refetch: VoidFunction
    isFetching: boolean
    isLoading: boolean
    error: Error | null
    data?: T | null
}

interface NetworkParametersType {
    method?: NetworkMethodType
    headers?: HeadersInit
    queryKey: string
    timeout?: number
    body?: BodyInit
    path: string
}

const BASE_URL = process.env.REACT_APP_BASE_URL
const DEFAULT_TIMEOUT = 10000

const useNetwork = <T>({ body, path, headers, timeout = DEFAULT_TIMEOUT, method = "GET", queryKey }: NetworkParametersType): NetworkResultType<T> => {
    const controller = new AbortController()
    const signal = controller.signal
    const url = `${BASE_URL}/${path}`


    type NetworkRequestAction<T> =
        | { status: "error", data: Error }
        | { status: "success", data: T }
        | { status: "loading" }
        | { status: "idle" }


    const initialState: Omit<NetworkResultType<T>, "refetch"> = {
        isFetching: false,
        isLoading: false,
        status: "idle",
        error: null,
        data: null,
    }

    const reducer = (
        state: Omit<NetworkResultType<T>, "refetch"> = initialState,
        action: NetworkRequestAction<T>
    ) => {
        switch (action.status) {
            case "success":
                return { ...state, isLoading: false, isFetching: false, error: null, data: action.data, status: action.status }
            case "error":
                return { ...state, isLoading: false, isFetching: false, error: action.data, status: action.status }
            case "loading":
                return { ...state, isLoading: true, isFetching: true, error: null, status: action.status }
            case "idle":
                return { ...state, status: action.status }
            default:
                return state
        }
    }

    interface CachedData<T> {
        [key: string]: T
    }

    const [state, dispatch] = useReducer(reducer, initialState)
    const [cache, setCache] = useState<CachedData<T>>()
    const { data, error, isFetching, isLoading, status } = state

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const customFetch = async (): Promise<Response> => {
        return await fetch(url, { body, method, headers, signal })
            .then((res: Response): Response => {
                clearTimeout(timeoutId)
                return res
            })
    }
    const fetchData = async () => {
        if (cache?.[queryKey]) {
            dispatch({ status: "success", data: cache[queryKey] })
        } else {
            dispatch({ status: "loading" })
            try {
                const response: Response = await customFetch()
                const result: T = await response.json()
                if (response.ok) {
                    setCache((prevCache) => ({ ...prevCache, [queryKey]: result }))
                    dispatch({ status: "success", data: result })
                } else {
                    dispatch({ status: "error", data: { message: "Something went wrong", name: "error" } })
                }
            } catch ({ name }) {
                if (name === "AbortError") {
                    dispatch({ status: "error", data: { message: "TIME_OUT_ERROR", name } })
                } else {
                    dispatch({ status: "error", data: error as Error })
                }
            }
        }
    }



    const refetch = () => {
        if (!isFetching) {
            fetchData()
        }
    }

    useEffect(() => {
        fetchData()
    }, [queryKey])


    console.log(state)
    return { data, isLoading, error, isFetching, refetch, status }
}

export default useNetwork