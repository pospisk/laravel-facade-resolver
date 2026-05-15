import { IFacadeResolver, FacadeResolution } from '../interfaces/IFacadeResolver.js';

export class FacadeResolver implements IFacadeResolver {
    private resolvers: IFacadeResolver[];

    constructor(resolvers: IFacadeResolver[]) {
        this.resolvers = resolvers;
    }

    public async resolve(accessor: string, method?: string): Promise<FacadeResolution | null> {
        for (const resolver of this.resolvers) {
            const result = await resolver.resolve(accessor, method);
            if (result) {
                return result;
            }
        }
        return null;
    }
}
