import Logo from "@/components/ui/ProductCard/Product.Logo";
import Name from "@/components/ui/ProductCard/Product.Name";
import Tags from "@/components/ui/ProductCard/Product.Tags";
import Title from "@/components/ui/ProductCard/Product.Title";
import Votes from "@/components/ui/ProductCard/Product.Votes";
import ProductCard from "@/components/ui/ProductCard/ProductCard";

const products = [
  {
    logo: "/images/wundergraph.png",
    name: "Thirdweb",
    title: "The fastest way to build web3 apps.",
    tags: ["Free", "Developer Tools"],
    votes: 530,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Resend",
    title: "The best API to reach humans instead of spam folders",
    tags: ["Free", "Developer Tools"],
    votes: 521,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "WunderGraph",
    title: "WunderGraph the next generation Backend For Frontend framework",
    tags: ["Free", "Developer Tools"],
    votes: 490,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Lost Pixel",
    title: "Visual Testing for Your Frontend",
    tags: ["Free", "Developer Tools"],
    votes: 478,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Webstudio",
    title: "Open visual development for the open web",
    tags: ["Free", "Node Code"],
    votes: 470,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Marsx",
    title: "Developer tool that combines AI, NoCode, and ProCode on top of MicroApps",
    tags: ["Free", "No Code"],
    votes: 439,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Usermaven",
    title: "Usermaven helps marketing and product teams turn more visitors into customers",
    tags: ["Free", "Analytics"],
    votes: 411,
    slug: "/post/wundergraph"
  },
  {
    logo: "/images/wundergraph.png",
    name: "Float UI",
    title: "Collection of Tailwind UI components and website templates",
    tags: ["Free", "No Code"],
    votes: 398,
    slug: "/post/wundergraph"
  },
]

export default function Home() {
  return (
    <section className="max-w-4xl mt-12 mx-auto px-4 md:px-8">
        <h1 className="text-slate-50 text-lg font-semibold xl:px-4">
          Find your next favorite product
        </h1>

        <div className="mt-10">
          <ul className="divide-y divide-slate-800/60">
            {
              products.map((item, idx) => (
              <li key={idx} className="py-3">
                <ProductCard href={item.slug}>
                  <Logo src={item.logo} alt={item.title} />
                  <div className="space-y-1">
                    <Name>
                      {item.name}
                    </Name>
                    <Title className="line-clamp-1 sm:line-clamp-2">
                      {item.title}
                    </Title>
                    <Tags items={["Free", "Developer Tools"]} />
                  </div>
                  <div className="flex-1 self-center flex justify-end">
                    <Votes count={item.votes} />
                  </div>
                </ProductCard>
              </li>
              ))
            }
          </ul>
        </div>
    </section>
  )
}
