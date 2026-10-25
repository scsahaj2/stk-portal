# STK Digital Karyalaya — Python વગરનું ઓનલાઇન પોર્ટલ

## આ પેકેજ શું છે?
આ **વાસ્તવિક ઓનલાઇન ડેટાબેઝ સાથે જોડાઈ શકે એવો વેબ એપ્લિકેશન પ્રોજેક્ટ** છે. HTML + CSS + JavaScript frontend અને Supabase (PostgreSQL + Auth) backend છે. Python ઇન્સ્ટોલ કરવાની જરૂર નથી. Vercel/Netlify પર ઓનલાઇન મૂક્યા પછી URL પરથી કમ્પ્યુટર, મોબાઇલ અને Smart TV browserમાં ખુલશે.

**મહત્ત્વપૂર્ણ:** આ ZIP પોતે પહેલેથી જાહેર વેબસાઇટ નથી. તેને ચલાવવા માટે તમારા નિયંત્રણમાં Supabase પ્રોજેક્ટ અને હોસ્ટિંગ એકાઉન્ટ તૈયાર કરવાની જરૂર છે. અહીંથી હું તમારી તરફથી ખાતું બનાવીને જાહેર ડોમેન પર deploy કરી શકતો નથી. Supabase URL અને key વગર સાચો ઓનલાઇન ડેટા કામ નહીં કરે.

## શરૂઆતથી સેટઅપ (એક વખત)

1. https://supabase.com પર તમારા સંસ્થાના નિયંત્રણમાં પ્રોજેક્ટ બનાવો.
2. Supabase Dashboard → SQL Editor માં `supabase_schema.sql` નો આખો કોડ ચલાવો.
3. પછી `import_74_services.sql` નો આખો કોડ ચલાવો. તે Excel આધારિત મૂળ 74 સેવાઓ ઉમેરશે.
4. Dashboard → Project Settings → API / Connect માંથી Project URL અને **publishable key અથવા anon public key** મેળવો. **secret/service_role key ક્યારેય ન વાપરશો**.
5. `config.js` ફાઇલ ખોલીને URL અને public key પેસ્ટ કરો, ફાઇલ સાચવો.
6. Supabase → Authentication → URL Configuration માં તમારી વેબસાઇટનું **Site URL** ગોઠવો. ઉપયોગ કરો ત્યારે signup email verification સેટિંગ પણ તપાસો.
7. Netlify (https://app.netlify.com/drop) પર આ `STK_Online_Portal` ફોલ્ડર ડ્રેગ-એન્ડ-ડ્રોપ કરીને હોસ્ટ કરો. અથવા Vercel પર static site deploy કરો. પછી જે URL મળે તે ઓનલાઇન પોર્ટલ છે. **ટીવી માટે પણ એ જ સાઇટ છે**.
8. પોર્ટલમાં **એકવાર Signup** કરીને Admin ઈમેલ માટે એકાઉન્ટ બનાવો.
9. Supabase SQL Editor માં નીચેની ક્વેરી ચલાવો; email બદલો:
   `UPDATE public.profiles SET role='super_admin', full_name='STK Super Admin' WHERE email='you@example.com';`
10. હવે લૉગઆઉટ કરીને ફરી લૉગિન કરો. Super Admin → Usersમાં ત્રણ Department Saints ને અધિકાર આપો; તેઓ/તેમના સંચાલકો પહેલેથી Signup થયેલા હોવા જોઈએ.
11. Super Admin → ટીવી ડિસ્પ્લે → વિવિધ ટીવી બનાવો. દરેક ટીવી માટે મળતી `tv.html?key=...` લિંક સંબંધિત ટીવી બ્રાઉઝરમાં ખોલો.

## કામગીરીની રીત
- સમિતિ સંચાલક → સેવાઓમાંથી યોગ્ય સેવા પસંદ કરો → ઓનલાઇન કાર્ય બનાવો → ડ્રાફ્ટ સાચવો → મંજૂરી માટે મોકલો.
- વિભાગીય સંત → ડેશબોર્ડમાં મંજૂરી બાકી કાર્ય ખોલો → મંજૂર અથવા પરત કરો.
- મંજૂર કાર્ય → વિભાગીય સંત 'ટીવી પર પ્રકાશિત કરો' પસંદ કરે → ટીવી અને જાહેર લખાણ નક્કી કરે.
- ટીવી લગભગ 20 સેકન્ડે પ્રકાશિત માહિતી રિફ્રેશ કરે છે અને લગભગ 12 સેકન્ડે આગળની માહિતી બતાવે છે.
- કામ શરૂ / પૂર્ણ / અંતિમ ચકાસણીનો ઇતિહાસ ડેટાબેઝમાં રહે છે.

## સુરક્ષા અને મર્યાદાઓ
- કડક Row Level Security (RLS) ચાલુ છે. પોતાના વિભાગ / સમિતિ પ્રમાણે જ કાર્ય ઍક્સેસ મળે છે.
- `tv_feed` ફક્ત નિર્ધારિત ટીવી કી ધરાવતી લિંક માટે મંજૂર જાહેર લખાણ આપે છે. આ લિંક્સને જાહેર ન ફેલાવો; જેની પાસે લિંક હશે તે ડિસ્પ્લે વાંચી શકશે.
- Registration પછી permissions **Super Admin** જ આપે છે.
- આ **પ્રથમ ઓનલાઇન MVP** છે, અંતિમ 74 વિશિષ્ટ વેબ-એપ મોડ્યુલોનો તૈયાર enterprise system નથી.
- હજી attachments upload, advanced monthly calendar drag/drop, real-time attendance capture, inventory transactions, HR privacy subroles, automatic email/WhatsApp, backup restoration UI, analytics અને audit tamper-protection વગેરેની જરૂર રહેશે.
- મહત્વપૂર્ણ વ્યક્તિગત, આરોગ્ય, નાણાકીય કે અન્ય ગોપનીય માહિતી production security audit પહેલાં સંગ્રહિત ન કરવી.
- Supabase અને hosting providerનાં પ્લાન/limits/ખર્ચ તેમની તાજેતરની શરતો પ્રમાણે રહેશે.

## ફાઇલો
`index.html` = પોર્ટલ; `app.js` = ઑનલાઇન કામગીરી; `tv.html` + `tv.js` = ટીવી પેજ; `style.css` = ડિઝાઇન; `config.js` = Supabase જાહેર સેટિંગ્સ; `seed.json` = 74 સેવાઓ અને 16 સમિતિઓની મૂળ મેટાડેટા; `supabase_schema.sql` = PostgreSQL / security; `import_74_services.sql` = મૂળ સેવાઓ આયાત; `README_GUJARATI.md` = માર્ગદર્શિકા.

## આગળનું વિકાસ
સમિતિવાર મૂળ ઓફલાઇન ફોર્મ અને સાચી નિયમાવલીઓ મળ્યા પછી દરેક સેવાનું વિશિષ્ટ મોડ્યુલ: EDU Monthly Planning Calendar, HRM Duty Allocation, ADM Inventory/Procurement, Meeting Minutes, Reports, Attachments, Inter-department handoffs વગેરે ઉમેરવા.
