import { Product } from './types';

export const PRODUCTS: Product[] = [
  {id:1,name:'Floral Kurti Set',brand:'EthnicWear',cat:'Fashion',price:899,mrp:1799,
   icon:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
   rating:4.8,reviews:3241,inf:true,creator:'@StyleByRiya',
   specs:[['Material','Cotton Blend'],['Sizes','XS–3XL'],['Wash','Machine Wash'],['Origin','Made in India']]},

  {id:2,name:'Wireless Earbuds Pro',brand:'SoundMax',cat:'Electronics',price:1299,mrp:2499,
   icon:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
   rating:4.3,reviews:1820,inf:false,
   specs:[['Driver','13mm Dynamic'],['Battery','30hr total'],['Connectivity','Bluetooth 5.3'],['Water','IPX5']]},

  {id:3,name:'Vitamin C Face Wash',brand:'GlowCare',cat:'Beauty',price:349,mrp:699,
   icon:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
   rating:4.6,reviews:5670,inf:true,creator:'@GlowWithNisha',
   specs:[['Volume','100ml'],['Skin Type','All skin types'],['Key Ingredient','Vitamin C, Niacinamide'],['Paraben Free','Yes']]},

  {id:4,name:'Running Sport Sneakers',brand:'FlexStep',cat:'Fashion',price:1499,mrp:2999,
   icon:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
   rating:4.4,reviews:2103,inf:false,
   specs:[['Sole','EVA Foam'],['Upper','Mesh'],['Sizes','UK 6–12'],['Weight','280g/pair']]},

  {id:5,name:'Smart Watch Series 5',brand:'TechWrist',cat:'Electronics',price:2299,mrp:4999,
   icon:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
   rating:4.2,reviews:987,inf:true,creator:'@TechByArjun',
   specs:[['Display','1.75" AMOLED'],['Battery','7 days'],['Water','IP68'],['GPS','Built-in']]},

  {id:6,name:'Premium Denim Jeans',brand:'DenimCo',cat:'Fashion',price:799,mrp:1599,
   icon:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
   rating:4.1,reviews:1450,inf:false,
   specs:[['Fit','Slim Fit'],['Material','98% Cotton'],['Wash','Cold Wash'],['Sizes','28–40 waist']]},

  {id:7,name:'Whey Protein 1kg',brand:'MuscleMax',cat:'Sports',price:899,mrp:1499,
   icon:'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
   rating:4.7,reviews:4320,inf:true,creator:'@FitIndia',
   specs:[['Protein','24g per serving'],['Servings','30'],['Flavour','Chocolate, Vanilla'],['Certified','FSSAI']]},

  {id:8,name:'Bluetooth Speaker',brand:'AudioPlus',cat:'Electronics',price:1799,mrp:3499,
   icon:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
   rating:4.0,reviews:780,inf:false,
   specs:[['Power','20W RMS'],['Battery','12 hrs'],['Waterproof','IPX7'],['Connectivity','BT 5.0 + AUX']]},

  {id:9,name:'Designer Silk Saree',brand:'WeaveIndia',cat:'Fashion',price:1299,mrp:2499,
   icon:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
   rating:4.8,reviews:2890,inf:true,creator:'@DesiLooks',
   specs:[['Fabric','Banarasi Silk'],['Length','6.3 meters'],['Blouse','Included'],['Care','Dry Clean Only']]},

  {id:10,name:'RGB Gaming Mouse',brand:'GamerZone',cat:'Electronics',price:699,mrp:1299,
   icon:'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
   rating:4.3,reviews:1230,inf:false,
   specs:[['DPI','100–12000'],['Buttons','7 Programmable'],['Lighting','16.8M RGB'],['Connection','USB 2.0']]},

  {id:11,name:'Matte Lipstick Set (6 pcs)',brand:'GlamFirst',cat:'Beauty',price:599,mrp:1199,
   icon:'https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=400&q=80',
   rating:4.7,reviews:6780,inf:true,creator:'@MakeupByMeera',
   specs:[['Count','6 shades'],['Type','Matte Finish'],['Long Lasting','8+ hours'],['Cruelty Free','Yes']]},

  {id:12,name:'Premium Yoga Mat',brand:'ZenFlex',cat:'Sports',price:799,mrp:1499,
   icon:'https://images.unsplash.com/photo-1601925228518-f6ede88a5827?w=400&q=80',
   rating:4.5,reviews:3400,inf:true,creator:'@YogaWithSneha',
   specs:[['Thickness','6mm'],['Material','TPE'],['Non-Slip','Yes'],['Size','183x61cm']]},

  {id:13,name:'Kids Wooden Puzzle Set',brand:'ToyLand',cat:'Kids',price:349,mrp:699,
   icon:'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80',
   rating:4.6,reviews:1890,inf:false,
   specs:[['Age','3+'],['Pieces','48'],['Material','Wood'],['Safety','BIS Certified']]},

  {id:14,name:'Sunscreen SPF 50+',brand:'DermaShield',cat:'Beauty',price:299,mrp:599,
   icon:'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=400&q=80',
   rating:4.5,reviews:8920,inf:true,creator:'@SkincareByPriya',
   specs:[['SPF','50+ PA++++'],['Volume','50ml'],['Tint','No White Cast'],['Suitable For','All skin types']]},

  {id:15,name:'Insulated Steel Bottle',brand:'HydroLife',cat:'Sports',price:499,mrp:999,
   icon:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
   rating:4.4,reviews:2670,inf:false,
   specs:[['Capacity','1 Litre'],['Material','Food-grade Steel'],['Insulation','24hr cold, 12hr hot'],['Leak Proof','Yes']]},

  {id:16,name:'Kids School Backpack',brand:'FunPack',cat:'Kids',price:449,mrp:899,
   icon:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
   rating:4.3,reviews:1120,inf:false,
   specs:[['Age','5-12'],['Capacity','15L'],['Material','Polyester'],['Waterproof','Yes']]},

  {id:17,name:'Noise Cancelling Headphones',brand:'SoundMax',cat:'Electronics',price:3499,mrp:6999,
   icon:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
   rating:4.6,reviews:2341,inf:false,
   specs:[['ANC','Active Noise Cancellation'],['Battery','30 hrs'],['Driver','40mm'],['Foldable','Yes']]},

  {id:18,name:'Moisturising Face Cream',brand:'GlowCare',cat:'Beauty',price:449,mrp:899,
   icon:'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
   rating:4.4,reviews:3210,inf:true,creator:'@GlowWithNisha',
   specs:[['Volume','50g'],['Type','Gel Cream'],['SPF','15'],['Suitable For','Oily & Combination']]},

  {id:19,name:'Resistance Bands Set',brand:'FitPro',cat:'Sports',price:599,mrp:1199,
   icon:'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&q=80',
   rating:4.5,reviews:1876,inf:false,
   specs:[['Set','5 resistance levels'],['Material','Natural Latex'],['Max Resistance','50 lbs'],['Length','200cm']]},

  {id:20,name:'Ethnic Kurta Pyjama',brand:'FabIndia',cat:'Fashion',price:1199,mrp:2399,
   icon:'https://images.unsplash.com/photo-1607001285628-bc7ccaf7ed21?w=400&q=80',
   rating:4.7,reviews:987,inf:false,
   specs:[['Material','Pure Cotton'],['Occasion','Festive & Casual'],['Sizes','S–XXL'],['Wash','Hand Wash']]},
];

export const ORDERS = [
  {id:'#ORD-2847',product:'Wireless Earbuds Pro',buyer:'Rahul Sharma',amount:'₹1,299',date:'15 Jan 2025',status:'Delivered'},
  {id:'#ORD-2841',product:'Vitamin C Face Wash',buyer:'Priya Mehta',amount:'₹349',date:'14 Jan 2025',status:'Shipped'},
  {id:'#ORD-2839',product:'Floral Kurti Set',buyer:'Anjali Singh',amount:'₹899',date:'14 Jan 2025',status:'Processing'},
  {id:'#ORD-2835',product:'Smart Watch Series 5',buyer:'Vikram Nair',amount:'₹2,299',date:'13 Jan 2025',status:'Delivered'},
  {id:'#ORD-2832',product:'Designer Silk Saree',buyer:'Sunita Rao',amount:'₹1,299',date:'12 Jan 2025',status:'Delivered'},
  {id:'#ORD-2828',product:'Whey Protein 1kg',buyer:'Arjun Kumar',amount:'₹899',date:'11 Jan 2025',status:'Delivered'},
];
