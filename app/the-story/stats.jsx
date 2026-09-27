export default () => {

    const stats = [
        {
            data: "200K+",
            desc: "Visits from developers"
        },
        {
            data: "10K+",
            desc: "Upvotes casted"
        },
        {
            data: "1000+",
            desc: "Dev Tools launched"
        },
        {
            data: "10k+",
            desc: "Registered users visit weekly"
        },
        {
            data: "#1",
            desc: "On Product Hunt"
        },
    ]

    return (
        <section className="py-28 bg-transparent">
            <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8">
                <div className="max-w-2xl xl:mx-auto xl:text-center">
                    <h3 className="text-white text-3xl font-semibold sm:text-4xl">
                        World #1 launchpad for dev tools and open source projects.
                    </h3>
                    <p className="mt-3 text-slate-300">
                        Loved by developers and growing.
                    </p>
                </div>
                <div className="mt-12">
                    <ul className="flex-wrap gap-x-12 gap-y-10 items-center space-y-8 sm:space-y-0 sm:flex xl:justify-center">
                        {
                            stats.map((item, idx) => (
                                <li key={idx} className="sm:max-w-[15rem]">
                                    <h4 className="text-4xl text-white font-semibold">{item.data}</h4>
                                    <p className="mt-3 text-slate-400 font-medium">{item.desc}</p>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div>
        </section>
    )
}