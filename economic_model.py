"""Transparent, deterministic teaching model for Maynard.

Coefficients are deliberately moderate, sign-restricted and horizon-specific.
They are scenario elasticities, not forecasts or estimates for a particular country.
"""
from __future__ import annotations
import math

HORIZONS = ("3 months", "1 year", "5 years", "10 years")
YEARS = (0.25, 1.0, 5.0, 10.0)

POLICIES = {
"Monetary policy": [
 ("policy_rate","Policy interest rate",4.0,0.0,12.0,0.25,"%"),
 ("qe","QE (+) / QT (−)",0.0,-10.0,15.0,0.5,"% of GDP / year"),
 ("bank_credit","Credit support to banks",1.0,0.0,10.0,0.25,"% of GDP"),
 ("infl_target","Inflation target",2.0,1.0,5.0,0.1,"%"),],
"Public spending": [
 ("infrastructure","Infrastructure",3.0,0.0,8.0,0.25,"% of GDP"),
 ("education","Education & research",5.0,2.0,10.0,0.25,"% of GDP"),
 ("welfare","Health & welfare",8.0,3.0,15.0,0.25,"% of GDP"),
 ("defence","Defence & security",2.0,0.5,8.0,0.25,"% of GDP"),],
"Taxation": [
 ("income_tax","Personal income tax",25.0,10.0,50.0,1.0,"average %"),
 ("corp_tax","Corporate income tax",25.0,5.0,45.0,1.0,"%"),
 ("vat","VAT / consumption taxes",20.0,0.0,35.0,1.0,"%"),
 ("wealth_tax","Wealth & inheritance taxes",0.5,0.0,3.0,0.1,"effective %"),],
"Public incentives": [
 ("family_aid","Families & fertility",1.0,0.0,5.0,0.25,"% of GDP"),
 ("job_aid","Jobs & employment",1.0,0.0,5.0,0.25,"% of GDP"),
 ("business_aid","Business & innovation",1.0,0.0,5.0,0.25,"% of GDP"),
 ("green_aid","Energy transition",1.0,0.0,5.0,0.25,"% of GDP"),],
"Trade policy": [
 ("tariffs","Import tariffs",5.0,0.0,40.0,1.0,"average %"),
 ("export_aid","Export incentives",0.5,0.0,5.0,0.25,"% of GDP"),
 ("immigration","Openness to immigration",50.0,0.0,100.0,5.0,"index"),
 ("capital_open","Openness to foreign capital",70.0,0.0,100.0,5.0,"index"),],
"Public debt management": [
 ("issuance","Net new bond issuance",3.0,-3.0,12.0,0.25,"% of GDP / year"),
 ("maturity","Average debt maturity",7.0,1.0,30.0,0.5,"years"),
 ("fixed_share","Fixed-rate debt share",80.0,0.0,100.0,5.0,"%"),
 ("privatisations","Privatisations",0.0,0.0,8.0,0.25,"% of GDP"),],
"Labour market": [
 ("min_wage","Minimum wage",50.0,0.0,80.0,2.0,"% of median wage"),
 ("flexibility","Labour-market flexibility",50.0,0.0,100.0,5.0,"index"),
 ("retirement","Retirement age",65.0,55.0,75.0,0.5,"years"),
 ("contributions","Social contributions",30.0,10.0,50.0,1.0,"% of payroll"),],
"Energy & environment": [
 ("carbon_tax","Carbon tax",50.0,0.0,250.0,5.0,"USD / tonne CO₂"),
 ("renewables","Renewables subsidies",1.0,0.0,5.0,0.25,"% of GDP"),
 ("energy_invest","Energy investment",2.0,0.0,8.0,0.25,"% of GDP"),
 ("environment","Environmental regulation",60.0,0.0,100.0,5.0,"index"),],
}
BASELINES = {p[0]:p[2] for rows in POLICIES.values() for p in rows}

METRICS = {
 "Real economy":["GDP","GDP growth","Consumption","Investment","Productivity","Employment","Unemployment"],
 "Public finance":["Deficit","Public debt","Tax burden","Interest expense"],
 "Prices":["Inflation","Market interest rate"],
 "External sector":["Exports","Imports","Trade balance","Exchange rate"],
 "Financial markets":["Equities","Bonds","Real estate","Commodities"],
 "Society":["Inequality","Fertility rate","Population","Private saving","Confidence"],
}
UNITS={"GDP":"USD bn","GDP growth":"%","Consumption":"USD bn","Investment":"USD bn","Productivity":"index","Employment":"million","Unemployment":"%","Deficit":"% of GDP","Public debt":"% of GDP","Tax burden":"% of GDP","Interest expense":"USD bn","Inflation":"%","Market interest rate":"%","Exports":"USD bn","Imports":"USD bn","Trade balance":"USD bn","Exchange rate":"index","Equities":"index","Bonds":"index","Real estate":"index","Commodities":"index","Inequality":"Gini","Fertility rate":"births/woman","Population":"million","Private saving":"% of GDP","Confidence":"index"}

def _clip(x,a,b): return max(a,min(b,x))
def _d(p,k,scale=1): return (p[k]-BASELINES[k])/scale

def simulate(policy:dict) -> list[dict]:
    """Return four horizon snapshots. USD amounts are constant-price bn except fiscal interest."""
    p={**BASELINES,**policy}; out=[]
    # broad shocks: percentage points of GDP or normalized policy deviations
    spend=sum(_d(p,k) for k in ("infrastructure","education","welfare","defence"))
    incentives=sum(_d(p,k) for k in ("family_aid","job_aid","business_aid","green_aid"))
    tax_take=.10*_d(p,"income_tax")+.12*_d(p,"corp_tax")+.09*_d(p,"vat")+.45*_d(p,"wealth_tax")
    demand_tax=-.035*_d(p,"income_tax")-.045*_d(p,"vat")-.025*_d(p,"corp_tax")-.015*_d(p,"wealth_tax",.5)
    rate_cut=-_d(p,"policy_rate"); openness=_d(p,"capital_open",10)+.55*_d(p,"immigration",10)
    tariff=_d(p,"tariffs",10); labour=_d(p,"flexibility",10)-.45*_d(p,"contributions",5)
    green=_d(p,"renewables")+_d(p,"green_aid")+.7*_d(p,"energy_invest")
    for j,(label,t) in enumerate(zip(HORIZONS,YEARS)):
        short=[.22,.65,.90,.75][j]; long=[.03,.18,.72,1.0][j]; mon=[.06,.32,.36,.10][j]
        fiscal=(.55*_d(p,"infrastructure")+.12*_d(p,"education")+.38*_d(p,"welfare")+.42*_d(p,"defence"))*short
        supply=(1.05*_d(p,"infrastructure")+1.25*_d(p,"education")+.75*_d(p,"business_aid")+.40*green)*long
        tax_supply=(-.05*_d(p,"corp_tax")-.012*_d(p,"income_tax")-.008*_d(p,"vat")-.006*_d(p,"wealth_tax",.5))*long
        gdp_gap=fiscal+.28*incentives*short+demand_tax*short+tax_supply+rate_cut*mon+.045*_d(p,"qe")*short+.10*_d(p,"bank_credit")*short
        gdp_gap+=.10*openness*long-.30*tariff*long+.08*labour*long+supply
        excess_min=max(0,p["min_wage"]-60); gdp_gap-=.012*excess_min*long
        trend=2.0+.10*supply+.03*openness-.04*tariff+.025*labour+tax_supply*.08
        # Annualised realised growth: cyclical effects matter most early;
        # productive-capacity effects dominate at five and ten years.
        observed_growth=_clip(trend+gdp_gap*[.55,.35,.08,.03][j],-12,15)
        gdp=1000*((1+trend/100)**t)*(1+_clip(gdp_gap,-18,25)/100)
        inflation=2.2+.11*fiscal*short+.055*rate_cut*[.2,.8,.7,.2][j]+.018*_d(p,"qe")
        inflation+=.09*tariff*short+.003*_d(p,"carbon_tax",10)*short+.035*_d(p,"vat")*short
        inflation+=(p["infl_target"]-2)*[.08,.28,.70,.90][j]
        inflation=_clip(inflation,-1,10)
        risk=max(0,70-75)/100 + max(0,_d(p,"issuance"))/35
        market=_clip(p["policy_rate"]*[.85,.7,.45,.35][j]+inflation*[.12,.25,.45,.55][j]+1.0+risk,0,15)
        consumption=.62*gdp*(1+.0015*rate_cut-.001*_d(p,"vat")+.0015*_d(p,"family_aid"))
        investment=.21*gdp*(1+.012*rate_cut*short+.012*_d(p,"business_aid")*long+.006*openness*long-.008*_d(p,"corp_tax")*long+.008*green*long)
        productivity=100*(1+.002*t)+supply*.65+.25*openness*long-.25*tariff*long
        unemployment=_clip(6-.10*gdp_gap-.10*_d(p,"job_aid")*short-.06*labour*long+.025*excess_min*long,2,18)
        employment=30*(1+.003*t)+(6-unemployment)*.22+.025*_d(p,"immigration")*long
        # fiscal balance: negative is deficit; issuance is financing and only excess adds a cash buffer/debt
        deficit=-3-spend-incentives-green*.35+tax_take+.10*gdp_gap+_d(p,"privatisations")*.15
        deficit=_clip(deficit,-18,8)
        primary=-deficit-market*.70
        debt=70
        steps=max(1,round(t)); dt=t/steps
        for _ in range(steps): debt=((1+market/100*dt)/(1+(trend+inflation)/100*dt))*debt+primary*dt-max(0,p["privatisations"])*dt/10
        debt+=max(0,p["issuance"]-max(0,-deficit))*min(t,1)*.35
        debt=_clip(debt,15,180)
        tax_burden=_clip(35+tax_take+.05*gdp_gap,15,60)
        interest=gdp*debt/100*market/100*(1-(p["fixed_share"]/100)*math.exp(-t/max(1,p["maturity"])))
        exports=.30*gdp*(1+.018*_d(p,"export_aid")*short-.018*tariff*long+.003*openness*long)
        imports=.32*gdp*(1-.022*tariff*short+.006*rate_cut*short+.002*openness*long)
        fx=100+1.8*(p["policy_rate"]-4)*short-1.0*_d(p,"qe")*short+.8*openness*long
        equities=100+4.0*rate_cut*short+2.2*gdp_gap+1.5*openness*long-1.0*tariff*long
        bonds=100-2.8*(market-4)+.08*_d(p,"maturity")+.035*_d(p,"fixed_share")
        housing=100+2.2*rate_cut*short+1.1*gdp_gap+.5*_d(p,"bank_credit")*short
        commodities=100+1.8*inflation+1.0*gdp_gap-.25*_d(p,"carbon_tax",10)*long
        gini=_clip(.34+.0015*_d(p,"flexibility")-.0012*_d(p,"min_wage")-.003*_d(p,"welfare")-.004*_d(p,"wealth_tax",.5)-.002*_d(p,"family_aid"),.22,.55)
        fertility=_clip(1.55+.025*_d(p,"family_aid")*long+.006*_d(p,"welfare")*long-.002*unemployment,1.1,2.5)
        population=50*(1+.0015*t)+.035*_d(p,"immigration")*t+(.08*(fertility-1.55)*t)
        saving=_clip(18+.22*_d(p,"income_tax")-.18*rate_cut+.12*(unemployment-6),5,35)
        confidence=_clip(100+1.4*gdp_gap-1.5*abs(inflation-2)-1.0*max(0,unemployment-6)-.08*max(0,debt-80),55,140)
        out.append({"Horizon":label,"GDP":gdp,"GDP growth":observed_growth,"Consumption":consumption,"Investment":investment,"Productivity":productivity,"Employment":employment,"Unemployment":unemployment,"Deficit":deficit,"Public debt":debt,"Tax burden":tax_burden,"Interest expense":interest,"Inflation":inflation,"Market interest rate":market,"Exports":exports,"Imports":imports,"Trade balance":exports-imports,"Exchange rate":fx,"Equities":equities,"Bonds":bonds,"Real estate":housing,"Commodities":commodities,"Inequality":gini,"Fertility rate":fertility,"Population":population,"Private saving":saving,"Confidence":confidence})
    return out

def grade(policy, rows):
    r=rows[-1]; score=100
    score-=8*abs(r["Inflation"]-2); score-=2.5*max(0,r["Unemployment"]-5); score-=.35*max(0,r["Public debt"]-80); score-=70*max(0,r["Inequality"]-.34)
    score+=2*min(4,max(-2,r["GDP growth"])); score=_clip(score,25,98)
    letter="A" if score>=85 else "B" if score>=72 else "C" if score>=58 else "D"
    shocks=sorted(((abs(policy[k]-BASELINES[k])/(next(x[4]-x[3] for v in POLICIES.values() for x in v if x[0]==k)),k) for k in BASELINES),reverse=True)[:3]
    names={x[0]:x[1] for v in POLICIES.values() for x in v}; chosen=", ".join(names[k] for _,k in shocks if _>.02) or "the baseline settings"
    good=[]; risks=[]
    if r["GDP growth"]>2.2: good.append("stronger productive capacity")
    if r["Unemployment"]<5.5: good.append("a firmer labour market")
    if r["Inequality"]<.335: good.append("a more even income distribution")
    if abs(r["Inflation"]-2)>1: risks.append("inflation is too far from price stability")
    if r["Public debt"]>85: risks.append("debt leaves little room for the next shock")
    if r["Deficit"]<-5: risks.append("the deficit is persistently large")
    if not risks: risks.append("implementation quality and political durability remain the chief risks")
    return letter,round(score),f"You changed {chosen}. The model's main transmission runs through aggregate demand first, then investment, labour supply and productivity. By year ten it produces {', '.join(good) if good else 'a broadly baseline real economy'}; however, {', and '.join(risks)}. My verdict: coordinate fiscal and monetary settings, finance permanent promises with permanent revenues, and judge investment by the capacity it creates—not by the money spent."
