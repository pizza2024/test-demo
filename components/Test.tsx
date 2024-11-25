'use client';

import { useAsyncEffect, useSetState } from "ahooks";
import axios from "axios";
import { ButtonHTMLAttributes, DetailedHTMLProps, useEffect, useRef } from "react";
async function getTronWeb() {
    let tronWeb;
    if ((window as any).tronLink.ready) {
      tronWeb = (window as any).tronLink.tronWeb;
    } else {
      const res = await (window as any).tronLink.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        tronWeb = (window as any).tronLink.tronWeb;
      }
    }
    return tronWeb;
  }
  
export default function Test() {
    const tronWebRef = useRef<any>()
    useAsyncEffect(async () => {
        tronWebRef.current = await getTronWeb()
    }, [])
    const [state, setState] = useSetState({
        ownerAddress: 'TQtbhpDPN6C8RULCFfFzsK1g7Yg5EqU1Et',
        activesJSON: JSON.stringify([
            {
                type: 2,
                permission_name: 'active0',
                threshold: 2,
                operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
                keys: [
                    {address: 'TZ4UXDV5ZhNW7fb2AMSbgfAEZ7hWsnYS2g', weight: 1},
                    {address: 'TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1', weight: 1}
                ]
            }
        ], null, 2),
        accountInfo: ''
    })
    const updatePermission = async () => {
        const actives = JSON.parse(state.activesJSON)
        const resp = await axios.post('https://api.nileex.io/wallet/accountpermissionupdate', {
            owner_address: state.ownerAddress,
            actives: actives,
            owner: {
                type: 0,
                permission_name: 'owner',
                threshold: 1,
                keys: [{address: state.ownerAddress, weight: 1}]
            },
            visible: true
        }, {
            headers: {accept: 'application/json', 'content-type': 'application/json'},
        })
        if (tronWebRef.current) {
            
            const signedTxn = await tronWebRef.current.trx.sign(resp.data);
            const receipt = await tronWebRef.current.trx.sendRawTransaction(signedTxn);    
            console.log(receipt)
        }
        
    }
    const getAccount = () => {
        axios.post('https://api.nileex.io/wallet/getaccount', {
            address: state.ownerAddress,
            visible: true
        }, {
            headers: {
                "Content-Type": "text/plain"
            }
        }).then(resp => {
            if (resp.status === 200) {
                console.log(resp.data)
                setState({
                    accountInfo: JSON.stringify(resp.data, null, 2)
                })
            }
        })
    }
    // useEffect(() => {
    //     getAccount()
    // }, [])
    return <div className="flex items-center justify-center w-full flex-col gap-8 py-[5rem]">
        <input type="text" className="border p-4 text-[#232323] w-[800px]" placeholder="owner" value={state.ownerAddress} onChange={(e) => {
            setState({
                ownerAddress: e.target.value
            })
        }} />
        <textarea className="border p-4 text-[#232323] w-[800px] h-[500px]" value={state.activesJSON} onChange={(e) => {
            setState({
                activesJSON: e.target.value
            })
        }}/>
        <Button onClick={() => {
            updatePermission()
        }}>updatePermission</Button>
        <div className="border border-[#DDD] border-3 w-[800px]"></div>
        <textarea className="border p-4 text-[#232323] w-[800px] h-[500px]" value={state.accountInfo} onChange={(e) => {
            setState({
                accountInfo: e.target.value
            })
        }}/>
        <Button onClick={() => {
            getAccount()
        }}>getAccount</Button>
    </div>
}

function Button(props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
) {
    return <button {...props} className="border border-[#DDD] p-1 text-[1rem] rounded">{props.children}</button>
}