import { UserCircleIcon } from "@heroicons/react/24/solid";
import {
  MediaRenderer,
  useContract,
  useListing,
  useNetwork,
  useNetworkMismatch,
  useMakeBid,
  useOffers,
  useMakeOffer,
  useBuyNow,
  useAddress,
} from "@thirdweb-dev/react";
import { ListingType } from "@thirdweb-dev/sdk";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Countdown from "react-countdown";
import network from "../../utils/network";
import { ethers } from "ethers";
import { Toaster } from "react-hot-toast";

function ListingPage() {
  const router = useRouter();
  const { listingId } = router.query as { listingId: string };
  const [bidAmount, setBidAmount] = useState("");
  const [, switchNetwork] = useNetwork();
  const networkMismatch = useNetworkMismatch();
  const [minimumNextBid, setMinimumNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();

  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );

  const { mutate: makeBid } = useMakeBid(contract);
  const offers = useOffers(contract, listingId);

  const { mutate: makeOffer } = useMakeOffer(contract);
  const { mutate: buyNow } = useBuyNow(contract);
  const { data: listing, isLoading, error } = useListing(contract, listingId);

  useEffect(() => {
    if (!listingId || !contract || !listing) return;

    if (listing.type === ListingType.Auction) {
      fetchMinNextBid();
    }
  }, [listingId, listing, contract]);

  const fetchMinNextBid = async () => {
    if (!listing || !contract) return;

    const { displayValue, symbol } = await contract.auction.getMinimumNextBid(
      listingId
    );

    setMinimumNextBid({
      displayValue: displayValue,
      symbol: symbol,
    });
  };

  const formatPlaceHolder = () => {
    if (!listing) return;
    if (listing?.type === ListingType.Direct) {
      return "Enter Offer Amount";
    }

    if (listing.type === ListingType.Auction) {
      return Number(minimumNextBid?.displayValue) === 0
        ? "Enter Bid Amount"
        : `${minimumNextBid?.displayValue} ${minimumNextBid?.symbol} or more`;
    }
  };

  const buyNft = async () => {
    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!listing || !contract || !listing) return;

    await buyNow(
      {
        id: listingId,
        buyAmount: 1,
        type: listing.type,
      },
      {
        onSuccess(data, variables, context) {
          alert("NFT bought successfully!");
          console.log("Success", data, variables, context);
          router.replace("/");
        },
        onError(error, variables, context) {
          alert("ERROR: NFT couldnt be bought");
          console.log("Error", error, variables, context);
        },
      }
    );
  };

  const createBidOrOffer = async () => {
    try {
      if (networkMismatch) {
        switchNetwork && switchNetwork(network);
        return;
      }
      //direct lisitng

      if (listing?.type === ListingType.Direct) {
        if (
          listing.buyoutPrice.toString() ===
          ethers.utils.parseEther(bidAmount).toString()
        ) {
          console.log("Buyout price met, buying NFT...");

          buyNft();
          return;
        }

        console.log("buyout price not met, making offer...");
        await makeOffer(
          {
            quantity: 1,
            listingId,
            pricePerToken: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert("Offer made successfully!");
              console.log("Success", data, variables, context);
              setBidAmount("");
            },
            onError(error, variables, context) {
              alert("Error: offer could not be made");
              console.log("error", error, variables, context);
            },
          }
        );
      }

      //auction listing
      if (listing?.type === ListingType.Direct) {
        console.log("Making bid...");

        await makeBid(
          {
            listingId,
            bid: bidAmount,
          },
          {
            onSuccess(data, variables, context) {
              alert("Bid made successfully!");
              console.log("Success", data, variables, context);
            },
            onError(error, variables, context) {
              alert("Error: bid could not be made");
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading)
    return (
      <div>
        <Header />
        <div className="text-center animate-pulse text-blue-500">
          <p>Loading Items...</p>
        </div>
      </div>
    );
  if (!listing) {
    return <div>Listing not found</div>;
  }
  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-2 flex flex-col lg:flex-row space-y-10 space-x-5 pr-10">
        <div className="p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-xl">
          <MediaRenderer src={listing.asset.image} />
        </div>

        <section className="flex-1 space-y-5 pb-20 lg:pb-0">
          <div>
            <h1 className="text-xl font-bold ">{listing.asset.name}</h1>
            <p className="text-gray-600">
              {listing.asset.description?.slice(0, 110) + "..."}
            </p>
            <p className="flex items-center text-xs sm:text-base">
              <UserCircleIcon className="h-5 " />
              <span className="font-semibold pr-1">Seller</span>
              {listing.sellerAddress}
            </p>
          </div>

          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-semibold">Listing Type:</p>
            <p>
              {listing.type === ListingType.Direct
                ? "Direct Listing"
                : "Auction Listing"}
            </p>

            <p className="font-semibold">Buy it Now Price:</p>
            <p className="text-4xl font-semibold">
              {listing.buyoutCurrencyValuePerToken.displayValue}{" "}
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>

            <button
              onClick={buyNft}
              className="col-start-2 mt-2 bg-blue-600 font-bold text-white rounded-full w-44 py-4 px-10"
            >
              <div>
                <Toaster />
              </div>
              Buy Now
            </button>
          </div>
          {/* if direct */}

          {listing.type === ListingType.Direct && offers && (
            <div className="grid grid-cols-2 gap-y-2">
              <p className="font-bold">Offers:</p>
              <p className="font-bold">{0}</p>
            </div>
          )}
          <div className="grid grid-cols02 space-y-2 items-center justify-end">
            <hr className="col-span-2" />
            <p className="col-span-2 font-bold">
              {listing.type === ListingType.Direct
                ? "Make an Offer"
                : "Place a Bid"}
            </p>

            {/* remaining time */}

            {listing.type === ListingType.Auction && (
              <>
                <p>Current Minimum Bid:</p>
                <p className="font-bold">
                  {minimumNextBid?.displayValue} {minimumNextBid?.symbol}
                </p>

                <p>Time Remaining:</p>
                <Countdown
                  date={Number(listing.endTimeInEpochSeconds.toString()) * 1000}
                />
              </>
            )}
            <input
              onChange={(e) => setBidAmount(e.target.value)}
              className="border p-2 rounded-lg mr-5"
              type="text"
              placeholder={formatPlaceHolder()}
            />
            <button
              onClick={createBidOrOffer}
              className="bg-red-600 font-bold text-white rounded-full w-44 py-4 px-10"
            >
              {listing.type === ListingType.Direct ? "Offer" : "Bid"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ListingPage;
