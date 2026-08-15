import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';
import { createManualDigitalOrder, listPublishedDigitalProducts } from './commerce.ts';

test('coin-only products expose no manual methods and reject manual checkout', async () => {
	const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:{DB:crypto.randomUUID()}}); const db=await mf.getD1Database('DB');
	try { await db.exec(`CREATE TABLE digital_products(id TEXT PRIMARY KEY,title TEXT,slug TEXT,summary TEXT,description TEXT,price INTEGER,cover_url TEXT,file_url TEXT,status TEXT,featured INTEGER,created_at INTEGER,updated_at INTEGER,checkout_policy TEXT); CREATE TABLE digital_product_sales(id TEXT PRIMARY KEY,product_id TEXT,status TEXT,amount INTEGER); CREATE TABLE digital_payment_methods(id TEXT PRIMARY KEY,name TEXT,type TEXT,account_name TEXT,account_number TEXT,asset_url TEXT,instructions TEXT,is_active INTEGER,display_order INTEGER,created_at INTEGER,updated_at INTEGER); CREATE TABLE digital_product_payment_methods(product_id TEXT,payment_method_id TEXT,created_at INTEGER); INSERT INTO digital_products VALUES('p','SantriPrint','santriprint-pro',NULL,NULL,10,NULL,NULL,'published',1,1,1,'coin_only'); INSERT INTO digital_payment_methods VALUES('m','Bank','bank',NULL,NULL,NULL,NULL,1,1,1,1);`);
		const products=await listPublishedDigitalProducts(db); assert.equal(products[0]?.paymentMethods.length,0);
		await assert.rejects(()=>createManualDigitalOrder(db,{productId:'p',buyerName:'U',buyerContact:'1',paymentMethodId:'m'}),/hanya dapat dibeli dengan coin/);
	} finally { await mf.dispose(); }
});
