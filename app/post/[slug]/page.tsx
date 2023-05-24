"use client"

import { IconArrowTopRight } from "@/components/Icons/IconArrowTopRight";
import Button from "@/components/ui/Button/Button";
import ButtonUpvote from "@/components/ui/ButtonUpvote";
import { Gallery, GalleryImage } from "@/components/ui/Gallery";
import LinkShiny from "@/components/ui/LinkShiny";
import ProductLogo from "@/components/ui/ProductCard/Product.Logo";
import ProductTitle from "@/components/ui/ProductCard/Product.Title";
import { TabLink, Tabs } from "@/components/ui/TabsLink";
import { Tag, TagsGroup } from "@/components/ui/TagsGroup";
import Link from "next/link";

export default function Page() {

    const product_images = ["/product/maxresdefault-1.jpg", "/product/maxresdefault-2.jpg", "/product/maxresdefault.jpg", "/product/wundergraph-opengraph.png", "/product/neonwundergraph-1.webp", "/product/wunderGraphtt.jpeg"]
    const tabs = [
        {
            name: "About product",
            hash: "#"
        },
        {
            name: "Comments",
            hash: "#comments"
        },
        {
            name: "Launch details",
            hash: "#details"
        },
        {
            name: "Related launches",
            hash: "#launches"
        },
    ]

    return (
        <section className="mt-20 pb-10 space-y-20">
            <div className="container-custom-screen" id="about">
                <ProductLogo src="/images/wundergraph.png" alt="WunderGraph the next generation Backend For Frontend framework" />
                <h1 className="mt-3 text-slate-100 font-medium">WunderGraph</h1>
                <ProductTitle className="mt-1">
                    WunderGraph the next generation Backend For Frontend framework
                </ProductTitle>
                <div className="text-sm mt-3 flex items-center gap-x-3">
                    <LinkShiny href="" target="_balnk" className="flex items-center gap-x-2">
                        Live preview
                        <IconArrowTopRight />
                    </LinkShiny>
                    <ButtonUpvote count={490} />
                </div>
            </div>
            <div>
                <Tabs className="sticky top-2 z-30 bg-slate-900">
                    {
                        tabs.map((item, idx) => (
                            <TabLink hash={item.hash} key={idx}>
                                {item.name}
                            </TabLink>
                        ))
                    }
                </Tabs>
                <div className="relative overflow-hidden pb-12">
                    <div className="absolute top-0 w-full h-[100px] opacity-40 bg-[linear-gradient(180deg,_rgba(124,_58,_237,_0.06)_0%,_rgba(72,_58,_237,_0)_100%)]"></div>
                    <div className="relative container-custom-screen mt-12">
                        <div className="prose text-slate-100">
                            <p>
                            WunderGraph is an open source API developer platform with a focus on developer experience. At its core, WunderGraph combines the API gateway pattern with the Backend for Frontend (BFF) patternto create the perfect developer experience for working with APIs.
                            </p>
                            <p>
                            WunderGraph can combine all of your services, databases such as Fauna, file storage, identity providers (IdPs), and third-party APIs into your own developer toolkit without experiencing vendor lock-in.
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3 items-center">
                            <h3 className="text-sm text-slate-400 font-medium">
                                Classified in
                            </h3>
                            <TagsGroup>
                                <Tag href="/">
                                    Dev Tools
                                </Tag>
                                <Tag href="/">
                                    Open Source
                                </Tag>
                                <Tag href="/">
                                    Framework
                                </Tag>
                            </TagsGroup>
                        </div>
                    </div>
                    <div className="max-w-screen-2xl mt-10 mx-auto sm:px-8">
                        <Gallery>
                           {
                               product_images.map((item, idx) => (
                                 <GalleryImage key={idx} src={item} alt="" />
                                ))
                           } 

                        </Gallery>
                    </div>
                </div>
            </div>
            <div className="container-custom-screen" id="comments">
                <h3 className="text-slate-50 font-medium">
                    Support and give a Feedback
                </h3>
                <form className="mt-12">
                    <div className="flex gap-x-4 items-start">
                        <div className="flex-none">
                            <img src="/images/random-user.jpg" className="w-10 h-10 object-cover rounded-full" />
                        </div>
                        <textarea 
                            placeholder="Write your feedback" 
                            className="text-sm text-slate-400 border-b border-slate-700 focus:border-slate-300 bg-transparent w-full outline-none h-32 duration-150" 
                        />
                    </div>
                    <div className="mt-3 flex justify-end">                        
                        <Button className="text-sm bg-slate-800 hover:bg-slate-700">
                            Comment
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
  }