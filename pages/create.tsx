import {
  useAddress,
  useContract,
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useOwnedNFTs,
  useCreateAuctionListing,
  useCreateDirectListing,
} from "@thirdweb-dev/react";
import {
  ChainId,
  NFT,
  NATIVE_TOKENS,
  NATIVE_TOKEN_ADDRESS,
} from "@thirdweb-dev/sdk";
import { Router, useRouter } from "next/router";
import React, { FormEvent, useState } from "react";
import Header from "../components/Header";

type Props = {};

const Create = ({}: Props) => {
  const address = useAddress();
  const router = useRouter();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );

  const [selectedNFT, setSelectedNFT] = useState<NFT>();

  const { contract: collectionContract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );

  const ownedNFTs = useOwnedNFTs(collectionContract, address);

  const networkMismatch = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  const {
    mutate: createDirectListing,
    isLoading,
    error,
  } = useCreateDirectListing(contract);

  const {
    mutate: createAuctionListing,
    isLoading: isLoadingDirect,
    error: errorDirect,
  } = useCreateDirectListing(contract);

  const handleCreateListing = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (networkMismatch) {
      switchNetwork && switchNetwork(ChainId.Goerli);
      return;
    }

    if (!selectedNFT) return;

    const target = e.target as typeof e.target & {
      elements: { listingType: { value: string }; price: { value: string } };
    };

    const { listingType, price } = target.elements;

    if (listingType.value === "directListing") {
      createDirectListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          tokenId: selectedNFT.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price.value,
          startTimestamp: new Date(),
        },
        {
          onSuccess(data, variables, context) {
            console.log("Success: ", data, variables, context);
            router.push("/");
          },
          onError(error, variables, context) {
            console.log("Error ", error, variables, context);
          },
        }
      );
    }

    if (listingType.value === "auctionListing") {
      createAuctionListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          buyoutPricePerToken: price.value,
          tokenId: selectedNFT.metadata.id,
          startTimestamp: new Date(),
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          // reservePricePerToken: 0,
        },
        {
          onSuccess(data, variables, context) {
            console.log("Success: ", data, variables, context);
            router.push("/");
          },
          onError(error, variables, context) {
            console.log("Error ", error, variables, context);
          },
        }
      );
    }
  };

  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-10 pt-2">
        <h1 className="text-4xl font-bold">List an Item</h1>
        <h2 className="text-xl font-semibold pt-5">
          Select an item you would like to sell
        </h2>
        <hr className="mb-5" />
        <p>Below you will find the NFT's you own in your wallet</p>

        <div className="flex overflow-x-scroll space-x-2 p-4">
          {ownedNFTs.data?.map((nft) => (
            <div
              className={`flex flex-col space-y-2 card min-w-fit border-2 bg-gray-100 ${
                nft.metadata.id === selectedNFT?.metadata.id
                  ? "border-black"
                  : "border-transparent"
              }`}
              key={nft.metadata.id}
              onClick={() => setSelectedNFT(nft)}
            >
              <MediaRenderer
                src={nft.metadata.image}
                className="h-48 rounded-lg"
              />
              <p className="text-lg truncate font-bold">{nft.metadata.name}</p>
              <p className="text-xs truncate">
                {nft.metadata.description?.slice(0, 20) + "..."}
              </p>
            </div>
          ))}
        </div>

        {selectedNFT && (
          <form onSubmit={handleCreateListing}>
            <div className="flex flex-col p-10">
              <div className="grid grid-cols-2 gap-5">
                <label className="border-r font-light">
                  Direct Listing / Fixed Price
                </label>
                <input
                  type="radio"
                  name="listingType"
                  value="directListing"
                  className="ml-auto h-10 w-10"
                />

                <label className="border-r font-light">Auction</label>
                <input
                  type="radio"
                  name="listingType"
                  value="auctionListing"
                  className="ml-auto h-10 w-10"
                />

                <label className="border-r font-light">Price</label>
                <input
                  type="text"
                  name="price"
                  placeholder="0.05"
                  className="bg-gray-100 p-5"
                />
              </div>

              <button
                className="bg-blue-600 text-white rounded-lf p-4 mt-8"
                type="submit"
              >
                Create Listing
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default Create;
