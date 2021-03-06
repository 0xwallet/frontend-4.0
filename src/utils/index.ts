import { classMultiClient, TSession } from "nkn";
import { LEN_OF_HEADER_U8_LENGTH } from "@/constants";

/** 获取同类数组的最后一个元素 */
export const lastOfArray = <T>(arr: T[]) => arr[arr.length - 1];

/** 转换size 显示 */
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/** 计算文件的sha256 哈希值,跟后端算法一样 */
export const getFileSHA256 = async (file: File): Promise<string> => {
  const timeTag = `计算文件-${file.name}-hash时间`;
  console.time(timeTag);
  const data = await file.arrayBuffer();
  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.timeEnd(timeTag);
  // console.log("hashHex", hashHex);
  return hashHex;
};

export type DescObj = {
  tagArr: string[];
  text: string;
};
/** 格式化描述信息,区分tag和普通文字 */
export const formatDescription = (sourceDesc: string | null): DescObj => {
  if (sourceDesc === null) return { tagArr: [], text: "" };
  // maybe length = 0
  const tagArr = [...sourceDesc.matchAll(/#(.*?)#/g)].map((i) => i[1].trim());
  const text = sourceDesc.replace(/#(.*?)#/g, "");
  return { tagArr, text };
};

/** 根据isDir/ 文件名后缀返回文件类型 */
export const getFileType = (obj: {
  isDir: boolean;
  fileName: string;
}): string => {
  if (obj.isDir) return "folder";
  const arr = obj.fileName.split(".");
  if (arr.length <= 1) return "file";
  return arr.pop()?.toLowerCase() || "file";
};

/** 根据后端返回的fullName(未处理过的) 计算出所在位置 */
export const getFileLocation = (fileFullName: string[]): string => {
  // 556.jpg
  // dist 556.jpg
  const arr = fileFullName;
  if (arr.length === 1) return "~";
  return "~/" + arr.join("/");
};

/** 根据分享文件的uri,code 拼接成分享链接,code可能是无或空字符串 */
export const getShareInfoByUriAndCode = ({
  uri,
  code,
  username,
  withHead,
  withCode,
  withTail,
}: {
  uri: string;
  code: string;
  username: string;
  withHead: boolean;
  withCode: boolean;
  withTail: boolean;
}): string => {
  const url = makeShareUrlByUri(uri);
  const headText = withHead ? "链接: " : "";
  const isCodeEmpty = code.length === 0 || code === "无";
  const codeText = isCodeEmpty ? "" : ` 访问码: ${code}`;
  const tailText = withTail ? `\n--来自0xWallet ${username}的分享` : "";
  const text = `${headText}${url}${withCode ? codeText : ""}${tailText}`;
  return text;
};

/** 根据uri返回分享链接 */
export const makeShareUrlByUri = (uri: string) => {
  const sharedFilePath = "/#/metanet/sharedFile";
  return `${window.location.origin}${sharedFilePath}?uri=${uri}`;
};

/** 返回重复dial 的闭包函数 */
export const getRepeatlyClientDialFn = (
  client: classMultiClient,
  addr: string
): (() => Promise<TSession | null>) => {
  let dialTryTimes = 0;
  /** 最多重试次数 */
  const maxDialTimes = 20;
  const repeatlyClientDial = async (): Promise<TSession | null> => {
    let res;
    try {
      // 10s 过期
      res = await client.dial(addr, { dialTimeout: 10000 });
      // 过期就重试
    } catch (error) {
      console.error("clientDial-error-dialTryTimes", error, dialTryTimes);
      if (dialTryTimes < maxDialTimes) {
        dialTryTimes += 1;
        res = await repeatlyClientDial();
      } else {
        res = null;
      }
    }
    return res;
  };
  return repeatlyClientDial;
};

/** 读取session 中的头部信息 */
export const readHeaderInSession = async (session: TSession) => {
  // 1 读取header 的长度
  const uint8ArrayOfHeaderLength = await session.read(LEN_OF_HEADER_U8_LENGTH);
  const dv = new DataView(uint8ArrayOfHeaderLength.buffer);
  const headerLength = dv.getUint32(0, true);
  // 2 读取header
  const header = await session.read(headerLength);
  return header;
};

/** 在session 中写入头部信息:1写入表示信息长度的固定buf, 2写入信息buf */
export const writeHeaderInSession = async (
  session: TSession,
  header: Uint8Array
) => {
  const bufOfHeaderlength = new ArrayBuffer(LEN_OF_HEADER_U8_LENGTH);
  const dv = new DataView(bufOfHeaderlength);
  dv.setUint32(0, header.length, true);
  // 1 写入header 的长度
  await session.write(new Uint8Array(bufOfHeaderlength));
  // 2 写入header
  await session.write(header);
};

/** 合并两个uint8array */
export const mergeUint8Array = (head: Uint8Array, tail: Uint8Array) => {
  const merged = new Uint8Array(head.length + tail.length);
  merged.set(head);
  merged.set(tail, head.length);
  return merged;
};

/** 通过blob 下载文件 */
export const downloadFileByBlob = (blob: Blob, fileName: string) => {
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, fileName);
  } else {
    const url = window.URL.createObjectURL(blob);
    downloadFileByUrl(url, fileName);
  }
};

/** 通过url 创建a标签下载文件 */
export const downloadFileByUrl = (
  url: string,
  fileName: string,
  target = "_blank"
) => {
  const link = document.createElement("a");
  link.style.visibility = "hidden";
  // fireFox 要求el 在body中
  document.body.appendChild(link);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.setAttribute("target", target);
  link.click();
  link.remove();
};

/** 创建n位数的随机数字字符串 */
export const getRandomNumStr = (n = 6): string => {
  const one = () => (Math.random() * 10) | 0;
  return Array(n)
    .fill(null)
    .map(() => one())
    .join("");
};

/** 从文件应用路由中提取窗口id */
export const exactWindowId = (fileRoutePath: string) => {
  const match = /id=(\d*)&?/g.exec(fileRoutePath);
  if (!match) throw Error(`提取路由中的窗口id 失败${fileRoutePath}`);
  const id = match?.[1];
  return +id;
};

const uniqueIdCache: { [key: string]: string } = {};
/** 从路由fullPath中获取唯一的标识(带缓存) */
export const exactUniqueTabId = (fullPath: string) => {
  // 缓存编译结果
  if (uniqueIdCache[fullPath]) return uniqueIdCache[fullPath];
  // metanet/file?id=2&path=~
  // 1. 文件应用就用windowId
  // 2. 其他应用就用对应的path
  uniqueIdCache[fullPath] = fullPath.includes("peerTransfer")
    ? "peerTransfer"
    : fullPath.includes("metanet/file")
    ? exactWindowId(fullPath).toString()
    : fullPath;
  return uniqueIdCache[fullPath];
};
