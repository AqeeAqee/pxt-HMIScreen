namespace hmi{

    let logY = 10, logYMin = 10, logYMax = 460, logYInterval = 16, logX = 10
    export function logToHMI(priority: ConsolePriority = ConsolePriority.Log, text: string) {
        if (priority > console.minPriority) return
        text = "[" + priority.toString() + "]" + text + "  "
        let bCmd
        if (deviceType == DeviceType.ta) {
            bCmd = Buffer.fromHex("AA5400000000")
            bCmd.setNumber(NumberFormat.UInt16BE, 2, logX)
            bCmd.setNumber(NumberFormat.UInt16BE, 4, logY)
        } else
            if (deviceType == DeviceType.dgus) { // todo
                bCmd = Buffer.fromHex("5AA55400000140")
                bCmd.setUint8(3, bCmd.length / 2)// length byte
            }
        logY += logYInterval
        if (logY > logYMax) logY = logYMin

        serial.writeBuffer(Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]))
        text = "                           "
        if (deviceType == DeviceType.ta) {
            bCmd.setNumber(NumberFormat.UInt16BE, 4, logY)
        } else
            if (deviceType == DeviceType.dgus) { // todo
            }
        serial.writeBuffer(Buffer.concat([bCmd, Buffer.fromUTF8(text), bCmdPostfix]))
    }

    /**
     * Debug Log to DWin
     */
    //% blockId=LogDebug block="[Debug] msg%text" blockGap=16
    //% advanced=true
    //% weight=50
    export function debug(text: string) {
        logToHMI(ConsolePriority.Debug, text)
    }

    /**
     * Output info to DWin as Log priority 
     */
    //% blockId=LogLog block="[Log] msg%text" blockGap=16
    //% advanced=true
    //% weight=50
    export function log(text: string) {
        logToHMI(ConsolePriority.Log, text)
    }

    /**
     * Output info to DWin as warning priority
     */
    //% blockId=LogWarning block="[Warning] msg%text" blockGap=16
    //% advanced=true
    //% weight=50
    export function warning(text: string) {
        logToHMI(ConsolePriority.Warning, text)
    }

    /**
     * Output info to DWin as Error priority
     */
    //% blockId=LogError block="[Error] msg%text" blockGap=16
    //% advanced=true
    //% weight=50
    export function error(text: string) {
        logToHMI(ConsolePriority.Silent, text)
    }

    /**
     * Output console logs to DWin
     */
    //% blockId=addToConsoleLogListener block="output console logs to DWin" blockGap=16
    //% advanced=true
    //% weight=50
    export function addToConsoleLogListener() {
        console.addListener(logToHMI)
    }

    /**
     * Output console log to DWin
     */
    //% blockId=addToConsoleLogListener block="only show priority%priority and above logs" blockGap=16
    //% advanced=true
    //% weight=50
    export function setMinPriority(priority: ConsolePriority) {
        console.minPriority = priority
    }


}