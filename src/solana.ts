import * as bs58 from 'bs58';
import { Connection, ParsedInstruction, PublicKey, Cluster, clusterApiUrl, PartiallyDecodedInstruction } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID: PublicKey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID: PublicKey = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function isPartiallyDecoded(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): instruction is PartiallyDecodedInstruction {
  return (instruction as PartiallyDecodedInstruction).accounts !== undefined;
}

export class Solana {
  network: string;
  connection: Connection = {} as Connection;

  constructor(network: string) {
    this.network = network;
  }

  connect(): void {
    const apiUrl = clusterApiUrl(this.network as Cluster);
    this.connection = new Connection(apiUrl, 'confirmed');
  }

  /// @throws (Error)
  async querySignature(signature: string) {
    if (this.connection) {
      const txList = await this.connection.getParsedTransactions([signature], 'confirmed');
      if (txList) {
        for (const tx of txList) {
          if (tx) {
            for (const instruction of tx.transaction.message.instructions) {
              console.log('Program ID:' + instruction.programId.toBase58());
              console.log(`Program ID to bytes: ${instruction.programId.toBytes()}`);
              if (isPartiallyDecoded(instruction)) {
                const partialInstruction = <PartiallyDecodedInstruction>instruction;
                for (let i = 0; i < partialInstruction.accounts.length; i++) {
                  console.log(`Account number ${i}: ${partialInstruction.accounts[i].toBase58()}`);
                }
                console.log(`Data: ${partialInstruction.data}`);

                const instructionData = bs58.decode(partialInstruction.data);
                console.log('Data in hex:');
                printBuffer(instructionData, 16);
                console.log('Data in decimal: ');
                printBuffer(instructionData, 10);
                console.log('printSlice function test:');
                printSlice(instructionData, 16);

                console.log(`Data in bytes: ${instructionData}`);
                console.log(`Program ID: ${partialInstruction.programId.toString()}`);
              } else {
                const parsedInstruction = <ParsedInstruction>instruction;
                console.log(parsedInstruction.parsed?.type);
                if (
                  parsedInstruction.parsed?.type === 'create' &&
                  instruction.programId.toBase58() === ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
                ) {
                  const info = parsedInstruction.parsed?.info;
                  console.log(`account: ${info.account}`);
                  console.log(`mint: ${info.mint}`);
                  console.log(`source: ${info.source}`);
                  console.log(`wallet: ${info.wallet}`);
                } else if (
                  parsedInstruction.parsed?.type === 'transferChecked' &&
                  instruction.programId.toBase58() === TOKEN_PROGRAM_ID.toBase58()
                ) {
                  const info = parsedInstruction.parsed?.info;
                  console.log(`authority: ${info.authority}`);
                  console.log(`mint: ${info.mint}`);
                  console.log(`destination: ${info.destination}`);
                  console.log(`source: ${info.source}`);
                }
              }
            }
          }
        }
      }
    } else {
      throw new Error('Not connected');
    }
  }
}

function printBuffer(buffer: Buffer, radix: number) {
  const array: string[] = [];
  for (let i = 0; i < buffer.length; i++) {
    array[i] = buffer[i].toString(radix);
  }
  console.log(array.join());
}

function printSlice(buffer: Buffer, radix: number) {
  if (buffer.length >= 8) {
    console.log(buffer.readBigInt64BE().toString(radix));
    console.log(buffer.readBigInt64LE().toString(radix));
    return;
  }
  if (buffer.length >= 4) {
    console.log(buffer.readInt32BE().toString(radix));
    console.log(buffer.readInt32LE().toString(radix));
    return;
  }
  if (buffer.length >= 2) {
    console.log(buffer.readInt16BE().toString(radix));
    console.log(buffer.readInt16LE().toString(radix));
    return;
  }
}

//takes in a buffer and radix
//prints the decimal repersentation of that buffer by converting it to hex, then to decimal
function printInt(buffer: Buffer, radix: number) {
  let array = bufferToArray(buffer, 16);
  let arrayToPrint: any = [];
  for (let i = 0; i < array.length; i++) {
    arrayToPrint[i] = parseInt(array[1], 10);
  }
  console.log();
}

//takes in a buffer and radix and returns an array repersentation of that buffer in that radix
function bufferToArray(buffer: Buffer, radix: number) {
  const array: string[] = [];
  for (let i = 0; i < buffer.length; i++) {
    array[i] = buffer[i].toString(radix);
  }
  return array;
}
