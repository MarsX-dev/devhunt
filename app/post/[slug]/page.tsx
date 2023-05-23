"use client"

import { IconArrowTopRight } from "@/components/Icons/IconArrowTopRight";
import ButtonUpvote from "@/components/ui/ButtonUpvote";
import LinkShiny from "@/components/ui/LinkShiny";
import ProductLogo from "@/components/ui/ProductCard/Product.Logo";
import ProductName from "@/components/ui/ProductCard/Product.Name";
import ProductTitle from "@/components/ui/ProductCard/Product.Title";
import { TabLink, Tabs } from "@/components/ui/TabsLink";
import Link from "next/link";

export default function Page() {

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
        <section className="mt-20">
            <div className="container-custom-screen" id="about">
                <ProductLogo src="/images/wundergraph.png" alt="WunderGraph the next generation Backend For Frontend framework" />
                <ProductName className="mt-3">WunderGraph</ProductName>
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
            <div className="mt-20">
                <Tabs className="sticky top-0 bg-slate-900">
                    {
                        tabs.map((item, idx) => (
                            <TabLink hash={item.hash} key={idx}>
                                {item.name}
                            </TabLink>
                        ))
                    }
                </Tabs>
            </div>
        </section>
    );
  }