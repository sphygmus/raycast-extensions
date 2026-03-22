import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Grid,
  Icon,
} from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import {
  getAllCharacters,
  getBanners,
  getGameVersion,
} from "./lib/utils/lunaris";
import { useMemo, useState } from "react";
import SingleCharacter from "./components/character/single-character";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: characters } = usePromise(getAllCharacters);
  const { isLoading, data: banners } = useCachedPromise(
    async (): Promise<BannerInformation[]> => {
      const gameVersion = await getGameVersion();
      const allBanners = await getBanners();
      if (!allBanners) return [];

      const bannerInformation: BannerInformation[] = Object.entries(
        allBanners.version,
      )
        .filter(([version]) => {
          const vNum = parseFloat(version);
          const gvNum = gameVersion ? parseFloat(gameVersion) : 0;

          if (!preferences.allowUnreleased && gvNum > 0 && vNum > gvNum) {
            return false;
          }
          return true;
        })
        .map(([version, characters]) => ({
          version,
          characters,
        }));

      return bannerInformation;
    },
  );

  const [selectedVersion, setSelectedVersion] = useState(
    banners && banners[0] ? banners[0].version : null,
  );

  const activeBanner = useMemo(() => {
    if (!banners) return;
    return banners.find((b) => b.version === selectedVersion);
  }, [selectedVersion]);

  return (
    <Grid
      isLoading={isLoading}
      columns={4}
      fit={Grid.Fit.Fill}
      aspectRatio="9/16"
      navigationTitle={`Banners / ${selectedVersion}`}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Select version"
          onChange={(newValue) => setSelectedVersion(newValue)}
        >
          {banners &&
            banners.map(({ version }) => (
              <Grid.Dropdown.Item
                key={version}
                title={version}
                value={version}
              />
            ))}
        </Grid.Dropdown>
      }
    >
      {activeBanner &&
        characters &&
        selectedVersion &&
        activeBanner.characters.map((id) => (
          <Grid.Item
            key={id}
            title={characters[id.toString()].enName}
            content={{
              source: `https://api.lunaris.moe/data/assets/gachaicon/${characters[id.toString()].GachaImg.replace("UI_Gacha_AvatarImg_", "UI_Gacha_AvatarIcon_")}.webp`,
            }}
            accessory={{
              icon: `elements/${characters[id.toString()].element === "Unknown" ? "adaptive" : characters[id.toString()].element.toLowerCase()}.png`,
              tooltip: characters[id.toString()].element,
            }}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Detailed Information"
                  icon={Icon.Person}
                  target={
                    <SingleCharacter
                      id={id.toString()}
                      character={characters[id.toString()]}
                    />
                  }
                />
              </ActionPanel>
            }
          />
        ))}
    </Grid>
  );
}
