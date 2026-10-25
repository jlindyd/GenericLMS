import {rejectWrite,noStore,serviceFailure} from '../../platform/server';
import {readAs} from '../../platform/session';
export default async function handler(req,res){noStore(res);if(rejectWrite(req,res))return;if(!req.cookies.dydBearer)return res.status(401).json({message:'Sign in to continue.'});try{res.json(await readAs(req.cookies.dydBearer,'identity','api/account/userinfo'))}catch(e){serviceFailure(res,e)}}
