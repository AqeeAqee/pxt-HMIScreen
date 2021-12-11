namespace hmi{

    ////////////////////////input/////////////////////////////

    let onTouchHandler: (x: number, y: number) => void
    let onTouchDownHandler: (x: number, y: number) => void
    let onTouchUpHandler: (x: number, y: number) => void


    /**
     * onTouch
     */
    //% blockId=onTouch block="onTouch" blockGap=16
    //% weight=49
    export function onTouch(handler: (x: number, y: number) => void): void {
        onTouchHandler = handler
    }

    /**
     * onTouchDown
     */
    //% blockId=onTouchDown block="onTouchDown" blockGap=16
    //% weight=49
    export function onTouchDown(handler: (x: number, y: number) => void): void {
        onTouchDownHandler = handler
    }

    /**
     * onTouchUp
     */
    //% blockId=onTouchUp block="onTouchUp" blockGap=16
    //% weight=49
    export function onTouchUp(handler: (x: number, y: number) => void): void {
        onTouchUpHandler = handler
    }

    let onReceivedHandler: (list: number[]) => void

    /**
     * On Received Unknown Msg
     */
    //% blockId=onReceivedUnknownMsg block="On Received Unknown Msg" blockGap=16
    //% weight=20
    export function onReceivedUnknownMsg(handler: (list: number[]) => void): void {
        onReceivedHandler = handler
    }

    function receivedCommand(listCommand: number[]) {

        if (listCommand[0] == 0x72) {
            if (onTouchUpHandler)
                onTouchUpHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
            if (onTouchHandler)
                onTouchHandler(listCommand[1] * 256 + listCommand[2], listCommand[3] * 256 + listCommand[4])
        } else if (listCommand[0] == 0x73) {
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

        rxV = serial.readBuffer(1)[0]
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
        //console.debug("rxIndex:" + rxIndex.toString() + " ,rx:0x" + Buffer.fromArray([rxV]).toHex() + " ,rxCmd:0x" + Buffer.fromArray(rxCmd).toHex())
    }

    export let receiveMsg_DGUS: Action = function () {

        rxV = serial.readBuffer(1)[0]
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

    //deprecated
    function toHexString(number: number, minByteLength: number = 1): string {
        let sCmd = ""
        let temp = Math.trunc(number)
        let temp2 = 0
        while (temp >= 1) {
            temp2 = temp % 16
            if (temp2 < 10) {
                sCmd = "" + convertToText(temp2) + sCmd
            } else {
                sCmd = "" + String.fromCharCode(temp2 + 55) + sCmd
            }
            temp = Math.trunc(temp / 16)
        }
        while (sCmd.length < minByteLength * 2)
            sCmd = "0" + sCmd
        return sCmd
    }

}