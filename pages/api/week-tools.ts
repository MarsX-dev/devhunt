import type {NextApiRequest, NextApiResponse} from 'next';
import ProductsService from '@/utils/supabase/services/products';
import {createBrowserClient} from '@/utils/supabase/browser';
import {checkAuthToken} from "@/pages/api/auth-token";
import {simpleToolApiDtoFormatter} from "@/pages/api/api-formatters";
import {cache} from "@/utils/supabase/services/CacheService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!checkAuthToken(req, res)) {
        return
    }

    let {week, limit = 3, year = (new Date()).getFullYear()} = req.query;

    let weekNumber = +week;
    if (week && Number.isNaN(weekNumber)) {
        return res.status(400).json({message: "Please provide week number as number"});
    }

    const productService = new ProductsService(createBrowserClient());

    const today = new Date();
    const currentWeek = await productService.getWeekNumber(today, 2);

    if (weekNumber === -1) {
        weekNumber = currentWeek > 1 ? currentWeek - 1 : 52;
        year = currentWeek > 1 ? today.getFullYear() : today.getFullYear() - 1;
    }

    if (!weekNumber) {
        weekNumber = currentWeek;
    }

    const tools = await cache.get(`week-tools-api-${year}-${weekNumber}-${limit}`,
        async () => {
            const weeks = await productService.getPrevLaunchWeeks(year, 2, weekNumber, 1);
            if (!weeks || weeks.length === 0) {
                return [];
            }

            const {products} = weeks[0];
            return products.slice(0, limit);
        }, 60);


    res.json(tools.map(simpleToolApiDtoFormatter));
}
