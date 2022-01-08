namespace hmi{

    //receive from radio
    let rcvRadioBuffer:number[]=[]
    export let onRadioReceivedHandler= function (rcvBuffer: Buffer) :void{
        rcvRadioBuffer=rcvRadioBuffer.concat(rcvBuffer.toArray(NumberFormat.UInt8BE))
    }

    function receiveOneByte(): number {
        if (_comType == CommunicationType.serial) {
            return serial.readBuffer(1)[0]
        } else if (_comType == CommunicationType.radio && rcvRadioBuffer.length > 0) {
            let v=rcvRadioBuffer.get(0)
            rcvRadioBuffer.removeAt(0)
            return v
        }
        return null
    }


    let onVersionReplyHandler: (str: string) => void

    /**
     * onVersionReply
     */
    //% blockId=onVersionReply block="on Version Reply" blockGap=16
    //% draggableParameters=reporter
    //% weight=49
    export function onVersionReply(handler: (str: string) => void): void {
        onVersionReplyHandler = handler
    }

    let onGetClockHandler: (hour: number, minute: number, second: number, year: number, month: number, date: number, week: number) => void
    /**
     * onGetClock
     */
    //% blockId=onGetClock block="on Get Clock" blockGap=16
    //% draggableParameters=reporter
    //% weight=49
    export function onGetClock(handler: (hour: number, minute: number, second: number, year: number, month: number, date: number, week: number) => void): void {
        onGetClockHandler = handler
    }

    function BCD2Dec(list:number[], iFirst:number, iLast:number){
        for(let i=iFirst;i<iLast;i++)
            list[i] -= (list[i]>>4)*6
    }

    function receivedCommand(listCommand: number[]) {
        //version
        if (listCommand[0] == 0 && onVersionReplyHandler) {
            onVersionReplyHandler(Buffer.fromArray(listCommand).slice(1, listCommand.length - 5 - 1).toString())
        }
        //clock
        else if (listCommand[0] == 0x9B && listCommand[1] == 0x5A && onGetClockHandler) {
            BCD2Dec(listCommand, 2,8)
            onGetClockHandler(listCommand[6], listCommand[7], listCommand[8], listCommand[2], listCommand[3], listCommand[4], listCommand[5])
        }
        //Touch Up
        else if (listCommand[0] == 0x72) {
            if (onTouchUpHandler)
                onTouchUpHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
            if (onTouchHandler)
                onTouchHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
        } 
        //Touch Down
        else if (listCommand[0] == 0x73) {
            if (onTouchDownHandler)
                onTouchDownHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
            if (onTouchHandler)
                onTouchHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
        } else {
            if (onReceivedHandler)
                onReceivedHandler(listCommand)
        }
    }

    let rxIndex = 0
    let rxV = 0
    let rxLength = 0
    let rxCmd: number[] = []

    export let receiveMsg_Ta: Action = function () {
        rxV = receiveOneByte()
        if(rxV==null)
            return

        if (rxV == 170 && rxIndex == 0) {
            rxIndex = 1
            rxCmd = []
        } else if (rxV == 204 && rxIndex == 1) {
            rxIndex = 2
        } else if (rxV == 51 && rxIndex == 2) {
            rxIndex = 3
        } else if (rxV == 195 && rxIndex == 3) {
            rxIndex = 4
        } else if (rxV == 60 && rxIndex == 4) {
            rxIndex = 0
            receivedCommand(rxCmd)
        } else {
            rxCmd.push(rxV)
        }
        //serial.writeLine("rxIndex:" + rxIndex.toString() + " ,rx:0x" + Buffer.fromArray([rxV]).toHex() + " ,rxCmd:0x" + Buffer.fromArray(rxCmd).toHex())
    }

    export let receiveMsg_DGUS: Action = function () {
        rxV = receiveOneByte()
        if (rxV == null)
            return

        console.debug("rx:" + rxV.toString())
        if (rxV == 0x5A && rxIndex == 0) {
            rxIndex = 1
        } else if (rxV == 0xA5 && rxIndex == 1) {
            rxIndex = 2
        } else if (rxIndex == 2) {
            rxLength = rxV
            rxCmd = []
            rxIndex = 3
        } else if (rxIndex == 3) {
            if (rxCmd.length < rxLength)
                rxCmd.push(rxV)
            else
                rxIndex = 0
            receivedCommand(rxCmd)
        }
    }

    let onTouchHandler: (x: number, y: number) => void
    let onTouchDownHandler: (x: number, y: number) => void
    let onTouchUpHandler: (x: number, y: number) => void

    /**
     * onTouch
     */
    //% blockId=onTouch block="onTouch" blockGap=16
    //% draggableParameters=reporter
    //% weight=40
    export function onTouch(handler: (x: number, y: number) => void): void {
        onTouchHandler = handler
    }

    /**
     * onTouchDown
     */
    //% blockId=onTouchDown block="onTouchDown" blockGap=16
    //% draggableParameters=reporter
    //% advanced=1
    //% weight=40
    export function onTouchDown(handler: (x: number, y: number) => void): void {
        onTouchDownHandler = handler
    }

    /**
     * onTouchUp
     */
    //% blockId=onTouchUp block="onTouchUp" blockGap=16
    //% draggableParameters=reporter
    //% advanced=1
    //% weight=40
    export function onTouchUp(handler: (x: number, y: number) => void): void {
        onTouchUpHandler = handler
    }

    let onReceivedHandler: (list: number[]) => void

    /**
     * On Received Unknown Msg
     */
    //% blockId=onReceivedUnknownMsg block="On Received Unknown Msg" blockGap=16
    //% draggableParameters=reporter
    //% advanced=1
    //% weight=20
    export function onReceivedUnknownMsg(handler: (list: number[]) => void): void {
        onReceivedHandler = handler
    }

}