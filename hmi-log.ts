namespace hmi{

    let logY = 10, logYMin = 10, logYMax = 270, logYInterval = 16, logX = 10
    export function logToHMI(priority: ConsolePriority = ConsolePriority.Log, text: string) {
        if (priority < console.minPriority) return
        text = "[" + ["D","L","W","E","S"].get(priority) + "]" + text + "  "
        showText(text, FontSize.fs12, logX, logY)
        // let bCmd
        // if (deviceType == DeviceType.ta) {
        //     bCmd = Buffer.fromHex("AA6E00000000") 
        //     bCmd.setNumber(NumberFormat.UInt16BE, 2, logX)
        //     bCmd.setNumber(NumberFormat.UInt16BE, 4, logY)
        // } else
        //     if (deviceType == DeviceType.dgus) { // todo
        //         bCmd = Buffer.fromHex("5AA55400000140")
        //         bCmd.setUint8(3, bCmd.length / 2)// length byte
        //     }
        // if(_comType==CommunicationType.serial)
        //     serial.writeBuffer(Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]))
        // else if(_comType==CommunicationType.radio){
        //     let b = Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]).chunked(19)
        //     b.forEach((subBuffer: Buffer, index: number): void => {
        //         radio.sendBuffer(subBuffer)
        //     })
        // }

        //clear next line
        logY += logYInterval
        if (logY > logYMax-logYInterval) logY = logYMin
        text = "                           "
        showText(text, FontSize.fs12, logX, logY)
        // if (deviceType == DeviceType.ta) {
        //     bCmd.setNumber(NumberFormat.UInt16BE, 4, logY)
        // } else
        //     if (deviceType == DeviceType.dgus) { // todo
        //     }
        // if (_comType == CommunicationType.serial)
        //     serial.writeBuffer(Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]))
        // else if (_comType == CommunicationType.radio){
        //     let b = Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]).chunked(19)
        //     b.forEach((subBuffer:Buffer, index:number):void=>{
        //         radio.sendBuffer(subBuffer)
        //     })
        // }
    }

    /**
     * Debug Log to DWin
     */
    //% blockId=LogDebug block="[Debug] msg%text" blockGap=16
    //% advanced=true
    //% weight=70
    export function debug(text: string) {
        logToHMI(ConsolePriority.Debug, text)
    }

    /**
     * Output info to DWin as Log priority 
     */
    //% blockId=LogLog block="[Log] msg%text" blockGap=16
    //% advanced=true
    //% weight=69
    export function log(text: string) {
        logToHMI(ConsolePriority.Log, text)
    }

    /**
     * Output info to DWin as warning priority
     */
    //% blockId=LogWarning block="[Warning] msg%text" blockGap=16
    //% advanced=true
    //% weight=68
    export function warning(text: string) {
        logToHMI(ConsolePriority.Warning, text)
    }

    /**
     * Output info to DWin as Error priority
     */
    //% blockId=LogError block="[Error] msg%text" blockGap=16
    //% advanced=true
    //% weight=67
    export function error(text: string) {
        logToHMI(ConsolePriority.Silent, text)
    }

    /**
     * Output console logs to DWin
     */
    //% blockId=addToConsoleLogListener block="output console logs to DWin" blockGap=16
    //% advanced=true
    //% weight=66
    export function addToConsoleLogListener() {
        console.addListener(logToHMI)
    }

    /**
     * only show logs of this priority and above. 
     * Debug < Log < Warning < Error
     */
    //% blockId=setMinPriority block="only show priority%priority and above logs" blockGap=16
    //% advanced=true
    //% weight=65
    export function setMinPriority(priority: ConsolePriority) {
        console.minPriority = priority
    }


}