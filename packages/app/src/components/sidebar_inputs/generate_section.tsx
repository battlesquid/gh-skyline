import { Tabs } from "@mantine/core";
import { IconBrandGithubFilled, IconCode } from "@tabler/icons-react";
import { CustomDataInput } from "./custom_data_input";
import { GithubDataInput } from "./github_data_input";

export interface GenerateSectionProps {
    ok: boolean;
    login: string;
}


export function GenerateSection({ ok, login }: GenerateSectionProps) {

    return (
        <Tabs defaultValue="github" >
            <Tabs.List grow mb={8}>
                <Tabs.Tab value="github" leftSection={<IconBrandGithubFilled size={12} />}>
                    Github
                </Tabs.Tab>
                <Tabs.Tab  value="custom" leftSection={<IconCode size={12} />}>
                    Custom
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="github">
                <GithubDataInput ok={ok} login={login} />
            </Tabs.Panel>

            <Tabs.Panel value="custom">
                <CustomDataInput />
            </Tabs.Panel>
        </Tabs>
    );
}
