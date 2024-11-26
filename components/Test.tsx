'use client';

import { useAsyncEffect, useSetState } from "ahooks";
import axios from "axios";
import { ButtonHTMLAttributes, DetailedHTMLProps, useRef } from "react";
const OWNER_ADDRESS  = "TQtbhpDPN6C8RULCFfFzsK1g7Yg5EqU1Et"
const TEST_ADDRESS_1 = "TRi9CnYFHBLX4Ax4vVjksPt7C9fjNb55yM"
const TEST_ADDRESS_2 = "TL4aK8fm2QxYBQnJ4XE9ZEcjPnxocjePAJ"
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
    if ((window as any).tronLink.ready) {
      tronWebRef.current = (window as any).tronLink.tronWeb;
    }
  }, [])
  const [state, setState] = useSetState({
    ownerAddress: OWNER_ADDRESS,
    testAddress1: TEST_ADDRESS_1,
    testAddress2: TEST_ADDRESS_2,
    activesJSON: JSON.stringify([
      {
        type: 2,
        permission_name: 'Hello World',
        threshold: 2,
        operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
        keys: [
          {address: TEST_ADDRESS_1, weight: 1},
          {address: TEST_ADDRESS_2, weight: 1}
        ]
      }
    ], null, 2),
    accountInfo: '',
    unsignedTransaction: '',
    from: '',
    grantedPermissionId: 2,
    to: '',
    amount: 0,
    multiSignedTransaction: '',
    approvedList: '',
    broadcastResult: '',
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
  const getUnsignedTransaction = async (data: {
    to: string;
    from: string;
    amount: number;
    permissionId: number
  }) => {
    const unsignedTransaction = await tronWebRef.current.transactionBuilder.sendTrx(data.to
      , data.amount, data.from, {permissionId: data.permissionId});
    return unsignedTransaction
  }
  const multiSign = async (unsignedTransaction: string) => {
    const signedTransaction = await tronWebRef.current.trx.multiSign(unsignedTransaction);
    return signedTransaction
  }
  return <div className="flex items-center justify-center w-full flex-col gap-8 py-[5rem]">
    <Button onClick={() => {
      getTronWeb()
    }}>Connect Wallet</Button>
    <input type="text" className="border p-4 text-[#232323] w-[800px]" placeholder="owner" value={state.ownerAddress}
           onChange={(e) => {
             setState({
               ownerAddress: e.target.value
             })
           }}/>
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
    <div className="border border-[#DDD] border-3 w-[800px]"></div>
    <input className="border p-4 text-[#232323] w-[800px]" type="text" placeholder={'from'} value={state.from}
           onChange={(e) => {
             setState({
               from: e.target.value
             })
           }}/>
    <input value={state.to} className="border p-4 text-[#232323] w-[800px]" type="text" placeholder={'to'}
           onChange={(e) => {
             setState({
               to: e.target.value
             })
           }}/>
    <input value={state.amount} className="border p-4 text-[#232323] w-[800px]" type="text" placeholder={'amount'}
           onChange={(e) => {
             setState({
               amount: +e.target.value
             })
           }}/>
    <input value={state.grantedPermissionId} className="border p-4 text-[#232323] w-[800px]" type="text"
           placeholder={'permission id'} onChange={(e) => {
      setState({
        grantedPermissionId: +e.target.id
      })
    }}/>
    <Button onClick={async () => {
      const unsignedTransaction = await getUnsignedTransaction({
        amount: state.amount,
        from: state.from,
        permissionId: state.grantedPermissionId,
        to: state.to
      })
      setState({
        unsignedTransaction: JSON.stringify(unsignedTransaction, null, 2)
      })
    }}>getUnsignedTransaction</Button>
    <textarea placeholder={'unsignedTransaction'} className="border p-4 text-[#232323] w-[800px] h-[500px]"
              value={state.unsignedTransaction} onChange={(e) => {
      setState({
        unsignedTransaction: e.target.value
      })
    }}/>
    <div className="border border-[#DDD] border-3 w-[800px]"></div>
    <Button onClick={async () => {
      const multiSignedTransaction = await multiSign(JSON.parse(state.unsignedTransaction))
      setState({
        multiSignedTransaction: JSON.stringify(multiSignedTransaction)
      })
    }}>getMultiSignedTransaction</Button>
    <textarea placeholder={'multiSignedTransaction'} className="border p-4 text-[#232323] w-[800px] h-[500px]"
              value={state.multiSignedTransaction} onChange={(e) => {
      setState({
        multiSignedTransaction: e.target.value
      })
    }}/>
    <div className="border border-[#DDD] border-3 w-[800px]"></div>
    <Button onClick={async () => {
      const approvedList = await tronWebRef.current.trx.getApprovedList(JSON.parse(state.multiSignedTransaction));
      setState({
        approvedList: JSON.stringify(approvedList, null, 2)
      })
    }}>getApprovedList</Button>
    <textarea className="border p-4 text-[#232323] w-[800px] h-[500px]" disabled={true}
              value={state.approvedList}></textarea>
    <div className="border border-[#DDD] border-3 w-[800px]"></div>
    <Button onClick={async () => {
      const result = await tronWebRef.current.trx.broadcast(JSON.parse(state.multiSignedTransaction));
      setState({
        broadcastResult: JSON.stringify(result)
      })
    }}>Broadcast Transaction</Button>
    <textarea
      placeholder={'broadcast result'}
      className="border p-4 text-[#232323] w-[800px] h-[500px]"
      disabled={true}
      value={state.broadcastResult}>
    </textarea>
  </div>
}

function Button(props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
) {
  return <button {...props} className="border border-[#DDD] p-1 text-[1rem] rounded">{props.children}</button>
}