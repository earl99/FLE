
var fleStor= new LocStor()
var fleTexts =  fleStor.getTexts() 

var url = document.URL;


const css = document.createElement("link");
css.rel = 'stylesheet'
css.id = "flecss"
css.src = chrome.runtime.getURL("fle-content.css");
(document.head || document.documentElement).appendChild(css);





if (url.includes('https://freelancehunt.com/project/')) {

    var textar = document.getElementById('comment-0')


    fleupdateTexts();

    countPrises();


    let plus = document.createElement('div')
    plus.innerText = '+'
    plus.style=`    z-index: 122;
                    background-color: rgb(74, 177, 70);
                    margin-top: 5px;
                    border: none;
                    width: 30px;
                    height: 30px;
                    position: absolute;
                    right: 20px;
                    top: 0px;
                    border-radius: 15px;
                    cursor: pointer;
                    text-align: center;
                    line-height: 30px;`

    let clear = document.createElement('div')
    clear.innerText = 'x'
    clear.style=`    z-index: 122;
                    background-color: rgb(233, 195, 90);
                    margin-top: 40px;
                    border: none;
                    width: 30px;
                    height: 30px;
                    position: absolute;
                    right: 20px;
                    top: 0px;
                    border-radius: 15px;
                    cursor: pointer;
                    text-align: center;
                    line-height: 30px;`



    plus.addEventListener('click',flehandlePlus)
    clear.addEventListener('click',flehandleClear)
    textar.position = 'relative';
    textar.insertAdjacentElement('beforebegin',plus)
    textar.insertAdjacentElement('beforebegin',clear)

   
    
}else if (url.includes('https://freelancehunt.com/projects')){

    let th = document.querySelector('table.project-list thead')
    if (th) th.remove()

    let projcts=document.querySelectorAll('.project-list tbody tr')

    let urllist = []
    projcts.forEach(pro=>{
        let u=pro.querySelector('a')?.getAttribute('href') || ''
        urllist.push(u)
       
    })
    console.log(urllist)

    fetchdata(urllist).then(resp=>{

    
        projcts.forEach(pro=>{
            let el=document.createElement('div')
            el.classList.add('fle-ava')
            el.style.position='relative'

            let mod = document.createElement('div')
            mod.classList.add('fle-mod')
            let u=pro.querySelector('a')?.getAttribute('href') || ''

            if (resp[u]) {
                el.style.backgroundImage = `url(${resp[u]['author']['avatar']})`;
                let lev = resp[u]['author']['level']
                let revs = resp[u]['author']['reviews']
                let reviewshtml = ''
                if (revs.length>0){
                    revs.forEach(r =>{
                        reviewshtml+= ` <div class="lastproject">
                                            <div class="pname fletext">${r[0]}</div>
                                            <div class="pprice ">${r[1]}</div>
                                        </div>`
                    })
                }
                el.style.border = `2px solid rgb(calc(${1 - lev}*255),calc(${lev} * 255),10,0.5)`
                el.style.borderTopWidth = `0px`

                el.classList.add('fle-active')
                mod.innerHTML=`    
                                    <div class="fcont fcontleft">
                                        <div class="fle-ava" style="background-image: url(${resp[u]['author']['avatar']}) ">
    
                                        </div>
                                        <div class="aname fletitle flegreen">${resp[u]['author']['name']}</div>
    
                                        <div class="fleainfo">
                                            <div class="fletext">
                                                Complete: ${resp[u]['author']['projectsComplete']}
                                                <span class="flegreen">(${resp[u]['author']['saveComplete']})</span>
                                                , Level: ${resp[u]['author']['level']}
                                            </div>
                                            <div class="fletext">
                                                Projects All: 
                                                <span class="">${resp[u]['author']['allProjects']}</span>
                                            </div>
                                            <div class="fletext tlittle">
                                                On Service: ${resp[u]['author']['timeOnService']}<br>
                                                Country: ${resp[u]['author']['town']}
                                            </div>
                                        </div>
                                        <div class="flelastauthorprojects">
                                            ${reviewshtml}
                                        </div>
                                    </div>
                                    <div class="fcont fcontright">
                                        <div class="fleprotitle fletitle flegreen">${resp[u]['title']}</div>
                                        <div class="fleprodesk fletext">${resp[u]['desk']}</div>
                                    </div>
                                `
            }
    
            el.insertAdjacentElement('afterbegin',mod)
            pro.insertAdjacentElement('afterbegin',el)
        })
    })
    

}