import { useNetwork } from "./hooks"

interface Data {
    completed: false
    userId: number
    title: string,
    id: number,
}

const App = () => {
    const { data, isFetching, error, isLoading, refetch } = useNetwork<Data[]>({
        path: "todos/1",
        queryKey: "test"
    })

    return (
        <div>
            <button onClick={() => console.log(data)}>DATA</button>
            <button onClick={() => refetch()}>REFETCH</button>
            <button onClick={() => console.log({ data, isLoading, error, isFetching })}>MORE OPTIONS</button>
        </div>
    )
}
export default App