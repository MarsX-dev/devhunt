import {NextApiRequest, NextApiResponse} from "next";

export function checkAuthToken(req: NextApiRequest, res: NextApiResponse) {
    if (req.headers.authorization === apiAuthToken) {
        return true;
    }

    res.status(403).send({message: 'Auth token is missing'});
    return false
}

export const apiAuthToken = 'YPuKUaHMTE8OWNwfM6D!!9qVvPc9AfKMJtielDMpZEPIXAbE1r=iwnZg5UI';