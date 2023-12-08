"use client";

// Account - IFRAME

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import useSWR from "swr";
import { isNil } from "lodash";
import { TokenboundClient } from "@tokenbound/sdk";
import { getAccountStatus } from "@/lib/utils";
import { TbLogo } from "@/components/icon";
import { useGetApprovals, useNft, useTBADetails } from "@/lib/hooks";
import { TbaOwnedNft } from "@/lib/types";
import { getAddress } from "viem";
import { HAS_CUSTOM_IMPLEMENTATION } from "@/lib/constants";
import { chainIdToOpenseaAssetUrl } from "@/lib/constants";
import "./page.css";

interface TokenParams {
  params: {
    tokenId: string;
    contractAddress: string;
    chainId: string;
  };
  searchParams: {
    disableloading: string;
    logo?: string;
  };
}

export default function Token({ params, searchParams }: TokenParams) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { tokenId, contractAddress, chainId } = params;
  const { disableloading, logo } = searchParams;
  const [showTokenDetail, setShowTokenDetail] = useState(false);
  const chainIdNumber = parseInt(chainId);

  const tokenboundClient = new TokenboundClient({ chainId: chainIdNumber });

  const {
    data: nftImages,
    nftMetadata,
    loading: nftMetadataLoading,
  } = useNft({
    tokenId: parseInt(tokenId as string),
    contractAddress: params.contractAddress as `0x${string}`,
    hasCustomImplementation: HAS_CUSTOM_IMPLEMENTATION,
    chainId: chainIdNumber,
  });

  useEffect(() => {
    if (!isNil(nftImages) && nftImages.length) {
      const imagePromises = nftImages.map((src: string) => {
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = src;
        });
      });

      Promise.all(imagePromises)
        .then(() => {
          setImagesLoaded(true);
        })
        .catch((error) => {
          console.error("Error loading images:", error);
        });
    }
  }, [nftImages, nftMetadataLoading]);

  // Fetch nft's TBA
  const { account, nfts, handleAccountChange, tba, tbaV2 } = useTBADetails({
    tokenboundClient,
    tokenId,
    tokenContract: contractAddress as `0x${string}`,
    chainId: chainIdNumber,
  });

  // Get nft's TBA account bytecode to check if account is deployed or not
  const { data: accountIsDeployed } = useSWR(
    account ? `/account/${account}/bytecode` : null,
    async () => tokenboundClient.checkAccountDeployment({ accountAddress: account as `0x{string}` })
  );

  const { data: isLocked } = useSWR(account ? `/account/${account}/locked` : null, async () => {
    if (!accountIsDeployed) {
      return false;
    }

    const { data, error } = await getAccountStatus(chainIdNumber, account!);

    return data ?? false;
  });

  const [tokens, setTokens] = useState<TbaOwnedNft[]>([]);

  const { data: approvalData } = useGetApprovals(nfts, account, chainIdNumber);

  useEffect(() => {
    if (nfts !== undefined) {
      nfts.map((token) => {
        const foundApproval = approvalData?.find((item) => {
          const contract = item.contract.address;
          const tokenId = item.tokenId;
          const hasApprovals = item.hasApprovals;
          const matchedAddress = getAddress(contract) === getAddress(token.contract.address);
          const matchedTokenId = String(tokenId) && String(token.tokenId);
          if (matchedAddress && matchedTokenId && hasApprovals) {
            return true;
          }
        });
        token.hasApprovals = foundApproval?.hasApprovals || false;
      });
      setTokens(nfts);
    }
  }, [nfts, approvalData, account]);

  const showLoading = disableloading !== "true" && nftMetadataLoading;

  return (
    <div className="h-screen w-screen bg-slate-100">
      <div className="max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden bg-white">
        <div className="relative h-full w-full">
          {account && nftImages && nftMetadata && (
            <div className="absolute left-4 top-4 z-10 rounded-full cursor-pointer">Rank</div>
          )}
          <div className="max-h-1080[px] relative h-full w-full max-w-[1080px]">
            {showLoading ? (
              <div className="absolute left-[45%] top-[50%] z-10 h-20 w-20 -translate-x-[50%] -translate-y-[50%] animate-bounce">
                <TbLogo />
              </div>
            ) : (
              <div
                className={`bg-white h-full w-full grid grid-cols-1 grid-rows-1 transition
                  }`}
              >
                {!isNil(nftImages) ? (
                  nftImages.map((image, i) => (
                    <>
                      <div className="bg-ghost bg-cover overflow-x-scroll no-scrollbar items-center justify-center right-0 sm:mt-0">
                        <div
                          className={`relative items-center justify-center`}
                        >
                          <div className="mt-20 ml-[5%] pb-24 grid grid-cols grid-flow-row gap-28">
                            {tokens.map((t, i) => {
                              let media = t?.media[0]?.gateway || t?.media[0]?.raw;
                              const isVideo = t?.media[0]?.format === "mp4";
                              if (isVideo) {
                                media = t?.media[0]?.raw;
                              }

                              const openseaUrl = `${chainIdToOpenseaAssetUrl[chainIdNumber]}/${t.contract.address}/${t.tokenId}`;

                              return (
                                <div className="card work">
                                  <div className="img-section">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="77" width="76"><path fill-rule="nonzero" fill="#3F9CBB" d="m60.91 71.846 12.314-19.892c3.317-5.36 3.78-13.818-2.31-19.908l-26.36-26.36c-4.457-4.457-12.586-6.843-19.908-2.31L4.753 15.69c-5.4 3.343-6.275 10.854-1.779 15.35a7.773 7.773 0 0 0 7.346 2.035l7.783-1.945a3.947 3.947 0 0 1 3.731 1.033l22.602 22.602c.97.97 1.367 2.4 1.033 3.732l-1.945 7.782a7.775 7.775 0 0 0 2.037 7.349c4.49 4.49 12.003 3.624 15.349-1.782Zm-24.227-46.12-1.891-1.892-1.892 1.892a2.342 2.342 0 0 1-3.312-3.312l1.892-1.892-1.892-1.891a2.342 2.342 0 0 1 3.312-3.312l1.892 1.891 1.891-1.891a2.342 2.342 0 0 1 3.312 3.312l-1.891 1.891 1.891 1.892a2.342 2.342 0 0 1-3.312 3.312Zm14.19 14.19a2.343 2.343 0 1 1 3.315-3.312 2.343 2.343 0 0 1-3.314 3.312Zm0 7.096a2.343 2.343 0 0 1 3.313-3.312 2.343 2.343 0 0 1-3.312 3.312Zm7.096-7.095a2.343 2.343 0 1 1 3.312 0 2.343 2.343 0 0 1-3.312 0Zm0 7.095a2.343 2.343 0 0 1 3.312-3.312 2.343 2.343 0 0 1-3.312 3.312Z"></path></svg>                </div>
                                  <div className="card-desc">
                                    <div className="card-header">
                                      <div className="card-title">AK 47</div>
                                      <div className="card-menu">
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                      </div>
                                    </div>

                                    <a href={openseaUrl} target="_blank" className="cursor-pointer">
                                      <img alt="Card" src={media} />
                                    </a>

                                  </div></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="absolute mt-20 ml-[60%]">

                        <div>
                          <img
                            key={i}
                            className="avatar"
                            src="https://www.freepnglogos.com/uploads/call-of-duty-png/call-of-duty-infinite-warfare-render-28.png"
                            alt="Nft image"
                          />
                        </div>
                      </div>


                    </>

                  ))
                ) : (
                  <></>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
