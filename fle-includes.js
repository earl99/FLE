class UniversalCache {
    constructor(cacheKey = 'universal_cache', maxItems = 100, ttlMs = 1000 * 60 * 60 * 24) {
        this.cacheKey = cacheKey;
        this.maxItems = maxItems; // максимальное кол-во записей
        this.ttlMs = ttlMs;       // время жизни записи (по умолчанию: 1 день)
    }

    _load() {
        const raw = localStorage.getItem(this.cacheKey);
        try {
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    _save(cache) {
        localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    }

    _isExpired(entry) {
        if(this.ttlMs===0) return false;
        return (Date.now() - entry.timestamp) > this.ttlMs;
    }

    _cleanup(cache) {
        // Удаляем устаревшие записи
        for (const key in cache) {
            if (this._isExpired(cache[key])) {
                delete cache[key];
            }
        }

        // Ограничиваем по количеству
        const keys = Object.keys(cache);
        if (keys.length > this.maxItems) {
            const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp); // по времени
            const toRemove = sorted.slice(0, keys.length - this.maxItems);
            toRemove.forEach(k => delete cache[k]);
        }

        return cache;
    }

    get(key) {
        const cache = this._load();
        const entry = cache[key];
        if (!entry || this._isExpired(entry)) {
            delete cache[key];
            this._save(cache);
            return null;
        }
        return entry.value;
    }
    getMany(keys) {
        const cache = this._load();
        let reslt={}
        let needtoupdate = false
        keys.forEach(key=>{

            const entry = cache[key];
            if (!entry || this._isExpired(entry)) {
                delete cache[key];
                needtoupdate = true
            }else{
                reslt[key]=entry.value
            }
        })
        if(needtoupdate) this._save(cache);
        return reslt;
    }

    set(key, value) {
        let cache = this._load();
        cache[key] = {
            value,
            timestamp: Date.now()
        };
        cache = this._cleanup(cache);
        this._save(cache);
    }

    setMany(values) {
        let cache = this._load();
        Object.keys(values).forEach(k=>{

            cache[k] = {
                value: values[k],
                timestamp: Date.now()
            };
            cache = this._cleanup(cache);
        })
        this._save(cache);
    }

    getAll() {
        const cache = this._load();
        const result = {};
        for (const key in cache) {
            if (!this._isExpired(cache[key])) {
                result[key] = cache[key].value;
            }
        }
        return result;
    }

    clear() {
        localStorage.removeItem(this.cacheKey);
    }

    remove(key) {
        const cache = this._load();
        delete cache[key];
        this._save(cache);
    }
}

class LocStor {
    constructor(){
        this.projects=new UniversalCache('projects')
        this.texts=new UniversalCache('texts',30,0)
    }


    setProjects = (prolist) =>{

        if (!prolist) return;
        this.projects.setMany(prolist)
    }

    setTexts = (data) =>{
        this.texts.set('texts',JSON.stringify(data))
    }


    getProjects = (prolist) =>{

        if (!prolist) return;

        let projecstfromcache = {}
        let projecsttofetch = []
        let ptget = []

        let inkeys = Object.keys(this.projects.getAll())
        
        prolist.forEach(k =>{
            if (!inkeys.includes(k)){
                projecsttofetch.push(k)
                // console.log(k, 'not in cache')
            }else{
                ptget.push(k)
            }
        })
        projecstfromcache=this.projects.getMany(ptget)
        return {projecstfromcache,projecsttofetch}
    }

    getTexts = () => {
        let res = this.texts.get('texts');

        if(!res) return []
        res = JSON.parse(res)

        return res;
    };

}

const fetchdata = async (urllist) => {

    let {projecstfromcache,projecsttofetch}=fleStor.getProjects(urllist)
    urllist = projecsttofetch;
    try {
        let data = {}
        if (urllist.length>0){
            console.log('Fetching data for ',urllist);
            
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify(urllist)
            };
            const res = await fetch('http://localhost:8000/api/page/', options);
            if (!res.ok) {
                throw new Error(`Ошибка ${res.status}: ${res.statusText}`);
            }
    
            data = await res.json(); // Парсим ответ как JSON
            if(data) fleStor.setProjects(data)
        }

        if (projecstfromcache){
            data = {...data,...projecstfromcache}
        }

        return data;

    } catch (error) {
        console.error("Error fetching logs:", error);
        return false;
    }
};

const flehandleBut = (event,text) => {
    event.preventDefault();
    textar.value = textar.value+' '+text;

}
const flehandleRemove = (event, indx) => {
    event.preventDefault();
    
    fleTexts = [...fleTexts.slice(0, indx), ...fleTexts.slice(indx + 1)];
    fleupdateTexts()
    fleStor.setTexts(fleTexts)
};


const flehandlePlus = (event) => {
    event.preventDefault();
    if (textar.value!==''){

        fleTexts.push(textar.value)
        fleStor.setTexts(fleTexts)
        fleupdateTexts()
    }

}
const flehandleClear = (event) => {
    event.preventDefault();
    if (textar.value!==''){
        textar.value='';
    }

}

const fleupdateTexts = () => {
    
    try{
        document.querySelector('.fle-ncblock').remove()
    }catch{}
    
    let nc = document.createElement('div');
    let ncstyle = document.createElement('style');
    ncstyle.innerHTML=`
    .fle-textBon{
        padding-left: 10px;
        gap: 5px;
        user-select: none;
        background-color: rgb(74, 177, 70);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        text-align: center;
        display: flex;
        }
    .fle-textBon span{
        color: rgb(28, 34, 27);
        margin: auto;
        }    
    .fle-textBon div{
        background-color: rgb(206 236 31 / 39%);
        height: 100%;
        width: 24px;
        border-radius: 5px;
        cursor: pointer;
    }
        
        `
    nc.classList.add('fle-ncblock');
    nc.appendChild(ncstyle);
    
    
    let comms = document.querySelector('#qfauto-1 .form-group,#qfauto-0 .form-group'); 
    if (comms) {
        if (fleTexts!==null){
            
            fleTexts.forEach((t,index) => {
                let b = document.createElement('div');
                b.addEventListener('click',e=>flehandleBut(e,t))
                b.classList.add('fle-textBon');  
                b.textindx=index;
                let btext = document.createElement('span');
                let bx = document.createElement('div');
                btext.innerText = t;
                bx.innerText = 'x';
                bx.addEventListener('click',e=>{e.stopPropagation();flehandleRemove(e,index)})
                b.appendChild(btext);
                b.appendChild(bx);
    
                nc.appendChild(b);
            });
        }
        comms.insertAdjacentElement('afterend', nc);
    } else {
        console.warn("Не найден элемент .qfauto-1 .form-group");
    }
}


const countPrises = () => {
    try {
        
        let nc = document.querySelector('.fle-ncblock')
        if(!nc)  return

        let prices = []
        document.querySelectorAll('ol#bids li div:nth-child(1) span:nth-child(2)').forEach(p=>{
            let np=p.innerText.replace(/\s+/g, '')
            let pricenum = np.match(/\d+/g)[0]
            let priceval = np.match(/\D+/g)[0]
            prices.push({"pn":pricenum,"pv":priceval})
        
        })

        let total = prices.reduce((sum, r) => sum + parseFloat(r.pn), 0);
        let avr =Math.floor(total/prices.length)
    
        let el=document.createElement('div')
        el.classList.add('fle-pricetot')

        el.innerText=`Average Price: ${avr} ${prices[0].pv}`
    
        nc.insertAdjacentElement('afterend', el);
    
        console.log(prices); // 3700
        console.log(avr);
    } catch (error) {
        console.log('Cant catch prices',error)
    }

}
