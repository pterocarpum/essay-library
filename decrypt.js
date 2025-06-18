function dtc(c,t){
    const a="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ \t\n\r\x0b\x0c",
        n=a.length,
        r=[],
        e=Array.from(t).filter(l=>a.includes(l)).join('');
    const d=e.length;
    let i=0;
    for(let s=0;s<c.length;s++){
        const o=c[s];
        if(a.includes(o)){
            const f=a.indexOf(o),
                u=e[i%d],
                h=a.indexOf(u),
                x=(f-h+n)%n,
                m=a[x];
            r.push(m);
            i++
        }else{
            r.push(o)
        }
    }
    return r.join('')
}
