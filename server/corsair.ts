import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { pool } from '@/db/db'

export const corsair = createCorsair({
    plugins: [googlecalendar({
        authType: "oauth_2" ,
        permissions:{
            mode:"open"
        }
        
    }), gmail({
        authType: "oauth_2" ,
        permissions:{
            mode:"open"
        }
    })],
    database:pool ,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});